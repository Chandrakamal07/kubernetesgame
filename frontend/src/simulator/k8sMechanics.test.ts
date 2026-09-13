import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ClusterSimulator } from './ClusterSimulator.ts';
import { CommandParser } from './CommandParser.ts';
import { KubeScheduler } from './Scheduler.ts';
import { SimulationClock } from './SimulationClock.ts';
import { matchesRequiredImage, normalizeImage, parseCpuQuantity, parseMemoryQuantity } from './imageUtils.ts';
import type { K8sNode, K8sPod } from './types.ts';

describe('Kubernetes Mechanics & Deterministic Rules Audit Test Suite', () => {
  it('Rule 1: Pod creation returns success immediately, but Pod is Pending and not Ready', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const result = sim.createPod('web-01', 'nginx');

    assert.equal(result.success, true);
    assert.equal(result.message, 'pod/web-01 created');

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'web-01');
    assert.ok(pod);
    assert.equal(pod.phase, 'Pending');
    assert.equal(pod.ready, false);
    assert.equal(pod.nodeName, null);
  });

  it('Rule 2: Scheduling & runtime startup transitions Pod to Running & Ready via virtual clock', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    sim.createPod('web-01', 'nginx');

    // Advance clock past API (180ms) -> Scheduler (450ms) -> Kubelet (750ms) -> Container Ready (1150ms)
    clock.advance(1500);

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'web-01');
    assert.ok(pod);
    assert.equal(pod.phase, 'Running');
    assert.equal(pod.ready, true);
    assert.ok(pod.nodeName !== null);
    assert.ok(pod.ip.startsWith('10.244.'));

    // Verify conditions
    const scheduledCond = pod.conditions.find((c) => c.type === 'PodScheduled');
    const readyCond = pod.conditions.find((c) => c.type === 'Ready');
    assert.equal(scheduledCond?.status, 'True');
    assert.equal(readyCond?.status, 'True');
  });

  it('Rule 3: Pod exceeding Node Allocatable memory remains Pending with FailedScheduling event', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    // Request 16Gi (16384Mi), which exceeds all node allocatable capacities (max is worker-2 with 7680Mi)
    const result = sim.createPod('big-cache', 'redis', {
      requests: { cpu: 0.5, memory: 16384 },
    });

    assert.equal(result.success, true);

    clock.advance(600);

    const state = sim.getState();
    const pod = state.pods.find((p) => p.name === 'big-cache');
    assert.ok(pod);
    assert.equal(pod.phase, 'Pending');
    assert.equal(pod.ready, false);
    assert.equal(pod.nodeName, null);

    // Verify FailedScheduling event exists in cluster audit log
    const failedSchedEvent = state.events.find(
      (e) => e.object === 'pod/big-cache' && e.reason === 'FailedScheduling'
    );
    assert.ok(failedSchedEvent, 'FailedScheduling warning event must be generated');
  });

  it('Rule 4: Deleting workload reclaims requested resources and triggers retry queue for Pending pod', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);

    // worker-3 has 1792Mi allocatable. Cordon worker-1 and worker-2
    const nodes = sim.getDefaultNodes();
    nodes[0].unschedulable = true;
    nodes[1].unschedulable = true;
    sim.reset(nodes);

    // 1. Create first pod that fits on worker-3
    sim.createPod('pod-a', 'nginx', { requests: { cpu: 0.5, memory: 1200 } });
    clock.advance(500);

    // 2. Create second pod that does NOT fit on worker-3 (needs 1000Mi, only 592Mi remaining)
    sim.createPod('pod-b', 'nginx', { requests: { cpu: 0.5, memory: 1000 } });
    clock.advance(500);

    let state = sim.getState();
    let podB = state.pods.find((p) => p.name === 'pod-b');
    assert.equal(podB?.phase, 'Pending');
    assert.equal(podB?.nodeName, null);

    // 3. Delete pod-a -> frees 1200Mi on worker-3
    const delResult = sim.deletePod('pod-a');
    assert.equal(delResult.success, true);

    // Advance clock to trigger retry queue
    clock.advance(500);

    state = sim.getState();
    podB = state.pods.find((p) => p.name === 'pod-b');
    assert.equal(podB?.nodeName, 'worker-3', 'Pending pod-b should be scheduled to worker-3 once resources free up');
  });

  it('Rule 5: Flag Parser differentiates -o wide from -o json and -o yaml', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
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

    const yamlResult = parser.execute('kubectl get nodes -o yaml');
    assert.equal(yamlResult.success, true);
    assert.equal(yamlResult.commandType, 'get_nodes_yaml');

    const nameResult = parser.execute('kubectl get pods -o name');
    assert.equal(nameResult.success, true);
    assert.equal(nameResult.commandType, 'get_pods_name');
    assert.ok(nameResult.output.includes('pod/web-01'));
  });

  it('Rule 6: Declarative apply (kubectl apply -f compute-01.yaml) creates workload with correct resource requests', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
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

  it('Rule 7: kubectl apply vs kubectl create semantics', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    // 1. Initial create
    const createResult = parser.execute('kubectl create -f compute-01.yaml');
    assert.equal(createResult.success, true);

    // 2. Repeated create fails with AlreadyExists
    const createRepeat = parser.execute('kubectl create -f compute-01.yaml');
    assert.equal(createRepeat.success, false);
    assert.ok(createRepeat.output.includes('AlreadyExists'));

    // 3. Repeated apply on existing unchanged object returns unchanged
    const applyRepeat = parser.execute('kubectl apply -f compute-01.yaml');
    assert.equal(applyRepeat.success, true);
    assert.equal(applyRepeat.commandType, 'apply_unchanged');
    assert.ok(applyRepeat.output.includes('unchanged'));
  });

  it('Rule 8: kubectl describe node calculates actual allocated pods and accurate Allocatable percentages', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    // Place a pod requesting 500m CPU (0.5 cores) and 1024Mi RAM
    sim.createPod('web-heavy', 'nginx', { requests: { cpu: 0.5, memory: 1024 } });
    clock.advance(500);

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

  it('Rule 9: kubectl describe pod for Pending Pod does NOT display Started or Pulled events', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    sim.createPod('pending-app', 'nginx');
    // Immediately describe before scheduling/startup
    const descResult = parser.execute('kubectl describe pod pending-app');
    assert.equal(descResult.success, true);
    assert.ok(descResult.output.includes('Status:       Pending'));
    assert.ok(descResult.output.includes('State:          Waiting (ContainerCreating)'));
    assert.ok(!descResult.output.includes('Started container'), 'Pending pod must not have Started container event');
  });

  it('Rule 10: Scheduler filters out Control-Plane Node with NoSchedule taint for regular Pods without toleration', () => {
    const scheduler = new KubeScheduler();

    const nodes: K8sNode[] = [
      {
        uid: 'node-cp',
        name: 'control-plane',
        role: 'control-plane',
        status: 'Ready',
        cpuCapacity: 2.0,
        memoryCapacity: 4096,
        cpuAllocatable: 1.8,
        memoryAllocatable: 3584,
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        labels: { 'node-role.kubernetes.io/control-plane': '' },
        conditions: [],
        taints: [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }],
      },
      {
        uid: 'node-w1',
        name: 'worker-1',
        role: 'worker',
        status: 'Ready',
        cpuCapacity: 2.0,
        memoryCapacity: 4096,
        cpuAllocatable: 1.8,
        memoryAllocatable: 3584,
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        labels: { 'node-role.kubernetes.io/worker': '' },
        conditions: [],
      },
    ];

    const regularPod: K8sPod = {
      uid: 'pod-1',
      name: 'app-01',
      image: 'nginx',
      normalizedImage: normalizeImage('nginx'),
      phase: 'Pending',
      containerState: 'Waiting',
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

  it('Rule 11: Canonical image matching correctly normalizes repository and tag', () => {
    assert.equal(matchesRequiredImage('nginx', 'nginx'), true);
    assert.equal(matchesRequiredImage('nginx:latest', 'nginx'), true);
    assert.equal(matchesRequiredImage('docker.io/library/nginx:latest', 'nginx'), true);
    assert.equal(matchesRequiredImage('redis', 'redis'), true);

    // Substrings must NOT match!
    assert.equal(matchesRequiredImage('my-nginx-broken-image', 'nginx'), false);
    assert.equal(matchesRequiredImage('nginx-ingress-controller', 'nginx'), false);
  });

  it('Rule 12: Bare Pod deletion does NOT self-heal', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    sim.createPod('bare-pod', 'nginx');
    clock.advance(500);

    assert.equal(sim.getState().pods.length, 1);
    sim.deletePod('bare-pod');
    assert.equal(sim.getState().pods.length, 0);

    clock.advance(2000);
    assert.equal(sim.getState().pods.length, 0, 'Bare Pods must not be automatically recreated upon deletion');
  });

  it('Rule 13: Resource quantity parsers handle millicores and Gi/Mi properly', () => {
    assert.equal(parseCpuQuantity('500m'), 0.5);
    assert.equal(parseCpuQuantity('250m'), 0.25);
    assert.equal(parseCpuQuantity('1'), 1.0);
    assert.equal(parseCpuQuantity('2.5'), 2.5);

    assert.equal(parseMemoryQuantity('1024Mi'), 1024);
    assert.equal(parseMemoryQuantity('1Gi'), 1024);
    assert.equal(parseMemoryQuantity('2Gi'), 2048);
    assert.equal(parseMemoryQuantity('256Mi'), 256);
  });

  it('Rule 14: Full Sequential Campaign Progression (Lessons 1 through 8)', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    // Lesson 1: kubectl get nodes
    const r1 = parser.execute('kubectl get nodes');
    assert.equal(r1.success, true);
    assert.equal(r1.commandType, 'get_nodes');

    // Lesson 3: kubectl run web-01 --image=nginx
    const r2 = parser.execute('kubectl run web-01 --image=nginx');
    assert.equal(r2.success, true);
    clock.advance(1500);
    let pod = sim.getState().pods.find((p) => p.name === 'web-01');
    assert.equal(pod?.ready, true);

    // Lesson 5: kubectl get pods -o wide
    const r3 = parser.execute('kubectl get pods -o wide');
    assert.equal(r3.success, true);
    assert.equal(r3.commandType, 'get_pods_wide');

    // Lesson 6: kubectl apply -f compute-01.yaml
    const r5 = parser.execute('kubectl apply -f compute-01.yaml');
    assert.equal(r5.success, true);
    clock.advance(1500);
    pod = sim.getState().pods.find((p) => p.name === 'compute-01');
    assert.equal(pod?.ready, true);
    assert.equal(pod?.resources.requests?.cpu, 0.5);

    // Lesson 7: kubectl apply -f big-cache.yaml (FailedScheduling)
    const r7 = parser.execute('kubectl apply -f big-cache.yaml');
    assert.equal(r7.success, true);
    clock.advance(600);
    pod = sim.getState().pods.find((p) => p.name === 'big-cache');
    assert.equal(pod?.phase, 'Pending');
    assert.equal(pod?.nodeName, null);

    // Lesson 8: kubectl delete pod big-cache
    const r8 = parser.execute('kubectl delete pod big-cache');
    assert.equal(r8.success, true);
    assert.equal(sim.getState().pods.some((p) => p.name === 'big-cache'), false);
  });

  it('Rule 15: Mission-aware error recovery when Pod already exists with wrong image', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    // Beginner mistakenly runs apache image
    parser.execute('kubectl run web-01 --image=apache');

    // Beginner attempts to run required nginx image with same pod name
    const result = parser.execute('kubectl run web-01 --image=nginx');
    assert.equal(result.success, false);
    assert.ok(result.output.includes('Recovery Guidance'));
    assert.ok(result.output.includes('kubectl delete pod web-01'));
    assert.ok(result.output.includes('kubectl run web-01 --image=nginx'));
  });

  it('Rule 16: Unknown flags are rejected with clear educational guidance', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);
    const parser = new CommandParser(sim);

    const res = parser.execute('kubectl get nodes --unknown-flag');
    assert.equal(res.success, false);
    assert.ok(res.output.includes('unknown flag: --unknown-flag'));
  });
});
