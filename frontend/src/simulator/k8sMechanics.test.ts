import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClusterSimulator } from './ClusterSimulator.ts';
import { CommandParser } from './CommandParser.ts';
import { KubeScheduler } from './Scheduler.ts';
import { matchesRequiredImage, normalizeImage, parseCpuQuantity, parseMemoryQuantity } from './imageUtils.ts';
import type { K8sNode, K8sPod } from './types.ts';

describe('Kubernetes Mechanics & Rules Audit Test Suite', () => {
  it('Rule 1: Pod creation returns success immediately, but Pod is Pending and not Ready', () => {
    const sim = new ClusterSimulator();
    const result = sim.createPod('web-01', 'nginx');

    assert.equal(result.success, true);
    assert.equal(result.message, 'pod/web-01 created');

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'web-01');
    assert.ok(pod);
    assert.equal(pod.phase, 'Pending');
    assert.equal(pod.status, 'Pending');
    assert.equal(pod.ready, false);
    assert.equal(pod.nodeName, null);
  });

  it('Rule 2: Scheduling & runtime startup transitions Pod to Running & Ready', async () => {
    const sim = new ClusterSimulator();
    sim.createPod('web-01', 'nginx');

    // Wait for asynchronous control plane simulation (scheduling + container runtime startup)
    await new Promise((resolve) => setTimeout(resolve, 2400));

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'web-01');
    assert.ok(pod);
    assert.equal(pod.phase, 'Running');
    assert.equal(pod.status, 'Running');
    assert.equal(pod.ready, true);
    assert.ok(pod.nodeName !== null);
    assert.ok(pod.ip.startsWith('10.244.'));

    // Verify conditions
    const scheduledCond = pod.conditions.find((c) => c.type === 'PodScheduled');
    const readyCond = pod.conditions.find((c) => c.type === 'Ready');
    assert.equal(scheduledCond?.status, 'True');
    assert.equal(readyCond?.status, 'True');
  });

  it('Rule 3: Pod exceeding Node Allocatable memory remains Pending with FailedScheduling event', async () => {
    const sim = new ClusterSimulator();
    // Request 16Gi (16384Mi), which exceeds all node allocatable capacities (max is worker-2 with 7680Mi)
    const result = sim.createPod('big-cache', 'redis', {
      requests: { cpu: 0.5, memory: 16384 },
    });

    assert.equal(result.success, true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'big-cache');
    assert.ok(pod);
    assert.equal(pod.phase, 'Pending');
    assert.equal(pod.status, 'Pending');
    assert.equal(pod.ready, false);
    assert.equal(pod.nodeName, null);

    // Verify FailedScheduling event exists in cluster audit log
    const failedSchedEvent = state.events.find(
      (e) => e.object === 'pod/big-cache' && e.reason === 'FailedScheduling'
    );
    assert.ok(failedSchedEvent, 'FailedScheduling warning event must be generated');
  });

  it('Rule 4: Deleting workload reclaims requested resources and triggers retry queue for Pending pod', async () => {
    const sim = new ClusterSimulator();

    // worker-3 has 1792Mi allocatable. Create pod consuming 1500Mi on worker-3 by cordoning worker-1 and worker-2
    const nodes = sim.getDefaultNodes();
    nodes[0].unschedulable = true;
    nodes[1].unschedulable = true;
    sim.reset(nodes);

    // 1. Create first pod that fits
    sim.createPod('pod-a', 'nginx', { requests: { cpu: 0.5, memory: 1200 } });
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 2. Create second pod that does NOT fit on worker-3 (needs 1000Mi, only 592Mi remaining)
    sim.createPod('pod-b', 'nginx', { requests: { cpu: 0.5, memory: 1000 } });
    await new Promise((resolve) => setTimeout(resolve, 600));

    let state = sim.getState();
    let podB = state.pods.find((p) => p.name === 'pod-b');
    assert.equal(podB?.phase, 'Pending');
    assert.equal(podB?.nodeName, null);

    // 3. Delete pod-a -> frees 1200Mi on worker-3
    const delResult = sim.deletePod('pod-a');
    assert.equal(delResult.success, true);

    // Wait for retry queue execution
    await new Promise((resolve) => setTimeout(resolve, 800));

    state = sim.getState();
    podB = state.pods.find((p) => p.name === 'pod-b');
    assert.equal(podB?.nodeName, 'worker-3', 'Pending pod-b should be scheduled to worker-3 once resources free up');
  });

  it('Rule 5: Flag Parser differentiates -o wide from -o json and -o yaml', () => {
    const sim = new ClusterSimulator();
    const parser = new CommandParser(sim);

    sim.createPod('web-01', 'nginx');

    const wideResult = parser.execute('kubectl get pods -o wide');
    assert.equal(wideResult.success, true);
    assert.equal(wideResult.commandType, 'get_pods_wide');
    assert.ok(wideResult.output.includes('NODE'));
    assert.ok(wideResult.output.includes('IP'));

    const jsonResult = parser.execute('kubectl get pods -o json');
    assert.equal(jsonResult.success, true);
    assert.equal(jsonResult.commandType, 'get_pods_json');
    assert.ok(jsonResult.output.includes('"kind": "PodList"'));
    assert.notEqual(jsonResult.commandType, 'get_pods_wide', '-o json must NOT be classified as get_pods_wide');

    const yamlResult = parser.execute('kubectl get nodes -o yaml');
    assert.equal(yamlResult.success, true);
    assert.equal(yamlResult.commandType, 'get_nodes_yaml');
  });

  it('Rule 6: Declarative apply (kubectl apply -f compute-01.yaml) creates workload with correct resource requests', () => {
    const sim = new ClusterSimulator();
    const parser = new CommandParser(sim);

    const applyResult = parser.execute('kubectl apply -f compute-01.yaml');
    assert.equal(applyResult.success, true);
    assert.equal(applyResult.commandType, 'apply_manifest');
    assert.equal(applyResult.parsedObject?.name, 'compute-01');
    assert.equal(applyResult.parsedObject?.cpuRequest, 0.5); // 500m

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'compute-01');
    assert.ok(pod);
    assert.equal(pod.resources.requests?.cpu, 0.5);
  });

  it('Rule 7: kubectl describe node calculates actual allocated pods and accurate Allocatable percentages', async () => {
    const sim = new ClusterSimulator();
    const parser = new CommandParser(sim);

    // Place a pod requesting 500m CPU (0.5 cores) and 1024Mi RAM
    sim.createPod('web-heavy', 'nginx', { requests: { cpu: 0.5, memory: 1024 } });
    await new Promise((resolve) => setTimeout(resolve, 600));

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'web-heavy');
    assert.ok(pod?.nodeName);

    const descResult = parser.execute(`kubectl describe node ${pod.nodeName}`);
    assert.equal(descResult.success, true);
    assert.ok(descResult.output.includes('Allocatable:'));
    assert.ok(descResult.output.includes('web-heavy'));
    assert.ok(descResult.output.includes('500m'));
    assert.ok(descResult.output.includes('1024Mi'));
  });

  it('Rule 8: kubectl describe pod for Pending Pod does NOT display Started or Pulled events', () => {
    const sim = new ClusterSimulator();
    const parser = new CommandParser(sim);

    sim.createPod('pending-app', 'nginx');
    // Immediately describe before scheduling/startup
    const descResult = parser.execute('kubectl describe pod pending-app');
    assert.equal(descResult.success, true);
    assert.ok(descResult.output.includes('Status:       Pending'));
    assert.ok(!descResult.output.includes('Started container'), 'Pending pod must not have Started container event');
  });

  it('Rule 9: Scheduler filters out Control-Plane Node with NoSchedule taint for regular Pods without toleration', () => {
    const scheduler = new KubeScheduler();

    const nodes: K8sNode[] = [
      {
        name: 'control-plane',
        role: 'control-plane',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2.0,
        memoryCapacity: 4096,
        cpuAllocatable: 1.8,
        memoryAllocatable: 3584,
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        laneIndex: 0,
        labels: { 'node-role.kubernetes.io/control-plane': '' },
        turretAngle: 0,
        serviceCapacity: 0,
        taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }],
      },
      {
        name: 'worker-1',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2.0,
        memoryCapacity: 4096,
        cpuAllocatable: 1.8,
        memoryAllocatable: 3584,
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        laneIndex: 0,
        labels: { 'node-role.kubernetes.io/worker': '' },
        turretAngle: 0,
        serviceCapacity: 0,
      },
    ];

    const regularPod: K8sPod = {
      name: 'app-01',
      image: 'nginx',
      normalizedImage: normalizeImage('nginx'),
      phase: 'Pending',
      status: 'Pending',
      ready: false,
      conditions: [],
      nodeName: null,
      resources: { requests: { cpu: 0.25, memory: 256 } },
      age: 0,
      restarts: 0,
      ip: '',
      namespace: 'default',
      creationTimestamp: Date.now(),
    };

    const decision = scheduler.evaluateNodes(regularPod, nodes);
    assert.equal(decision.selectedNode?.name, 'worker-1');
    const cpEval = decision.evaluations.find((e) => e.nodeName === 'control-plane');
    assert.equal(cpEval?.passedFilter, false);
    assert.ok(cpEval?.filterReason?.includes('taint'));

    // Now test a Pod with matching toleration
    const toleratedPod: K8sPod = {
      ...regularPod,
      tolerations: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }],
    };
    const decision2 = scheduler.evaluateNodes(toleratedPod, [nodes[0]]);
    assert.equal(decision2.selectedNode?.name, 'control-plane', 'Pod with toleration should be eligible for tainted control-plane node');
  });

  it('Rule 10: Canonical image matching correctly normalizes repository and tag', () => {
    assert.equal(matchesRequiredImage('nginx', 'nginx'), true);
    assert.equal(matchesRequiredImage('nginx:latest', 'nginx'), true);
    assert.equal(matchesRequiredImage('docker.io/library/nginx:latest', 'nginx'), true);
    assert.equal(matchesRequiredImage('redis', 'redis'), true);

    // Substrings must NOT match!
    assert.equal(matchesRequiredImage('my-nginx-broken-image', 'nginx'), false);
    assert.equal(matchesRequiredImage('nginx-ingress-controller', 'nginx'), false);
  });

  it('Rule 11: Bare Pod deletion does NOT self-heal', async () => {
    const sim = new ClusterSimulator();
    sim.createPod('bare-pod', 'nginx');
    await new Promise((resolve) => setTimeout(resolve, 600));

    assert.equal(sim.getState().pods.length, 1);
    sim.deletePod('bare-pod');
    assert.equal(sim.getState().pods.length, 0);

    // Wait and verify it is not recreated
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal(sim.getState().pods.length, 0, 'Bare Pods must not be automatically recreated upon deletion');
  });

  it('Rule 12: Resource quantity parsers handle millicores and Gi/Mi properly', () => {
    assert.equal(parseCpuQuantity('500m'), 0.5);
    assert.equal(parseCpuQuantity('250m'), 0.25);
    assert.equal(parseCpuQuantity('1'), 1.0);
    assert.equal(parseCpuQuantity('2.5'), 2.5);

    assert.equal(parseMemoryQuantity('1024Mi'), 1024);
    assert.equal(parseMemoryQuantity('1Gi'), 1024);
    assert.equal(parseMemoryQuantity('2Gi'), 2048);
    assert.equal(parseMemoryQuantity('256Mi'), 256);
  });

  it('Rule 13: Full Sequential Campaign Progression (Chapter 1 Level 1, Requests 1A through 1F)', async () => {
    const sim = new ClusterSimulator();
    const parser = new CommandParser(sim);

    // Req 1: kubectl get nodes
    const r1 = parser.execute('kubectl get nodes');
    assert.equal(r1.success, true);
    assert.equal(r1.commandType, 'get_nodes');

    // Req 2: kubectl run web-01 --image=nginx
    const r2 = parser.execute('kubectl run web-01 --image=nginx');
    assert.equal(r2.success, true);
    await new Promise((resolve) => setTimeout(resolve, 2400));
    let pod = sim.getState().pods.find((p) => p.name === 'web-01');
    assert.equal(pod?.ready, true);

    // Req 3: kubectl get pods -o wide
    const r3 = parser.execute('kubectl get pods -o wide');
    assert.equal(r3.success, true);
    assert.equal(r3.commandType, 'get_pods_wide');

    // Req 4: kubectl describe node
    const r4 = parser.execute(`kubectl describe node ${pod?.nodeName || 'worker-1'}`);
    assert.equal(r4.success, true);
    assert.equal(r4.commandType, 'describe_node');

    // Req 5: kubectl apply -f compute-01.yaml
    const r5 = parser.execute('kubectl apply -f compute-01.yaml');
    assert.equal(r5.success, true);
    await new Promise((resolve) => setTimeout(resolve, 2400));
    pod = sim.getState().pods.find((p) => p.name === 'compute-01');
    assert.equal(pod?.ready, true);
    assert.equal(pod?.resources.requests?.cpu, 0.5);

    // Req 6: kubectl apply -f db-01.yaml
    const r6 = parser.execute('kubectl apply -f db-01.yaml');
    assert.equal(r6.success, true);
    await new Promise((resolve) => setTimeout(resolve, 2400));
    pod = sim.getState().pods.find((p) => p.name === 'db-01');
    assert.equal(pod?.ready, true);
    assert.equal(pod?.resources.requests?.memory, 1024);

    // Req 7: kubectl apply -f big-cache.yaml (FailedScheduling)
    const r7 = parser.execute('kubectl apply -f big-cache.yaml');
    assert.equal(r7.success, true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    pod = sim.getState().pods.find((p) => p.name === 'big-cache');
    assert.equal(pod?.phase, 'Pending');
    assert.equal(pod?.nodeName, null);

    // Req 8: kubectl delete pod big-cache
    const r8 = parser.execute('kubectl delete pod big-cache');
    assert.equal(r8.success, true);
    assert.equal(sim.getState().pods.some((p) => p.name === 'big-cache'), false);

    // Req 9: kubectl apply -f gateway-01.yaml
    const r9 = parser.execute('kubectl apply -f gateway-01.yaml');
    assert.equal(r9.success, true);
    await new Promise((resolve) => setTimeout(resolve, 2400));
    pod = sim.getState().pods.find((p) => p.name === 'gateway-01');
    assert.equal(pod?.ready, true);
    assert.equal(pod?.nodeName, 'worker-2', 'Only worker-2 has sufficient remaining allocatable memory (2048Mi) and CPU (1000m)');
  });
});
