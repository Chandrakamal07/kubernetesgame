import type {
  ClusterEvent,
  KubernetesClusterState,
  K8sNode,
  K8sPod,
  PodCondition,
  ResourceRequirements,
} from './types.ts';
import { KubeScheduler } from './Scheduler.ts';
import { formatCpu, formatMemory, normalizeImage } from './imageUtils.ts';
import { SimulationClock, globalSimulationClock } from './SimulationClock.ts';
import { eventBus } from '../engine/GameEventBus.ts';

export type ClusterListener = (state: KubernetesClusterState, latestEvent?: ClusterEvent) => void;

export class ClusterSimulator {
  private state: KubernetesClusterState;
  private scheduler: KubeScheduler;
  private listeners: Set<ClusterListener> = new Set();
  private startTime: number = Date.now();
  private clock: SimulationClock;
  private podSeq: number = 0;

  constructor(initialNodes?: K8sNode[], clock: SimulationClock = globalSimulationClock) {
    this.clock = clock;
    this.scheduler = new KubeScheduler();
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace: 'chapter1-level1',
      containerRuntime: 'containerd',
      podCIDR: '10.244.0.0/16',
      nodes: initialNodes ? JSON.parse(JSON.stringify(initialNodes)) : this.getDefaultNodes(),
      pods: [],
      events: [],
    };
    this.addInitialEvents();
  }

  public getClock(): SimulationClock {
    return this.clock;
  }

  public getDefaultNodes(): K8sNode[] {
    return [
      {
        uid: 'node-worker-1',
        name: 'worker-1',
        role: 'worker',
        status: 'Ready',
        cpuCapacity: 2.0,
        memoryCapacity: 4096, // 4Gi in Mi
        cpuAllocatable: 1.8, // Capacity minus kube-reserved/system-reserved
        memoryAllocatable: 3584, // 3.5Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-1' },
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure', message: 'kubelet has no disk pressure' },
          { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPIDs', message: 'kubelet has sufficient PIDs available' },
        ],
      },
      {
        uid: 'node-worker-2',
        name: 'worker-2',
        role: 'worker',
        status: 'Ready',
        cpuCapacity: 4.0,
        memoryCapacity: 8192, // 8Gi in Mi
        cpuAllocatable: 3.8,
        memoryAllocatable: 7680, // 7.5Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-2' },
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure', message: 'kubelet has no disk pressure' },
          { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPIDs', message: 'kubelet has sufficient PIDs available' },
        ],
      },
      {
        uid: 'node-worker-3',
        name: 'worker-3',
        role: 'worker',
        status: 'Ready',
        cpuCapacity: 2.0,
        memoryCapacity: 2048, // 2Gi in Mi
        cpuAllocatable: 1.8,
        memoryAllocatable: 1792, // 1.75Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-3' },
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
          { type: 'DiskPressure', status: 'False', reason: 'KubeletHasNoDiskPressure', message: 'kubelet has no disk pressure' },
          { type: 'PIDPressure', status: 'False', reason: 'KubeletHasSufficientPIDs', message: 'kubelet has sufficient PIDs available' },
        ],
      },
    ];
  }

  private addInitialEvents() {
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-1',
      message: 'Node worker-1 status is now: NodeReady (Allocatable: 1.8 CPU, 3.5Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-2',
      message: 'Node worker-2 status is now: NodeReady (Allocatable: 3.8 CPU, 7.5Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-3',
      message: 'Node worker-3 status is now: NodeReady (Allocatable: 1.8 CPU, 1.75Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
  }

  public getState(): KubernetesClusterState {
    return {
      clusterName: this.state.clusterName,
      namespace: this.state.namespace,
      containerRuntime: this.state.containerRuntime,
      podCIDR: this.state.podCIDR,
      nodes: this.state.nodes.map((n) => ({ ...n, pods: [...n.pods], conditions: [...n.conditions] })),
      pods: this.state.pods.map((p) => ({ ...p, conditions: [...p.conditions] })),
      events: [...this.state.events],
    };
  }

  public reset(nodes?: K8sNode[], namespace = 'chapter1-level1') {
    this.clock.reset();
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace,
      containerRuntime: 'containerd',
      podCIDR: '10.244.0.0/16',
      nodes: nodes ? JSON.parse(JSON.stringify(nodes)) : this.getDefaultNodes(),
      pods: [],
      events: [],
    };
    this.startTime = Date.now();
    this.addInitialEvents();
    this.notifyListeners();
  }

  public subscribe(listener: ClusterListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(latestEvent?: ClusterEvent) {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot, latestEvent));
  }

  public addEvent(event: Omit<ClusterEvent, 'id' | 'timestamp' | 'timeSeconds'>): ClusterEvent {
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const date = new Date();
    const timeStr = date.toTimeString().split(' ')[0];

    const fullEvent: ClusterEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timeStr,
      timeSeconds: elapsedSeconds,
    };

    this.state.events = [fullEvent, ...this.state.events.slice(0, 49)];
    this.notifyListeners(fullEvent);
    return fullEvent;
  }

  /**
   * Submits a pod creation request through the simulated Kubernetes control plane.
   * Phase 1: API Server accepts and validates object -> returns pod created.
   * Phase 2: Asynchronously schedules, pulls image, starts container, and reaches Ready status via SimulationClock.
   */
  public createPod(
    name: string,
    image: string,
    resources: ResourceRequirements = { requests: { cpu: 0, memory: 0 } }
  ): { success: boolean; message: string; pod?: K8sPod } {
    // Check if pod already exists in namespace
    if (this.state.pods.some((p) => p.name === name)) {
      return {
        success: false,
        message: `Error from server (AlreadyExists): pods "${name}" already exists in namespace "${this.state.namespace}"`,
      };
    }

    const normImage = normalizeImage(image);
    const cpuReq = resources.requests?.cpu ?? 0;
    const memReq = resources.requests?.memory ?? 0;
    const podUid = `pod-${++this.podSeq}-${Math.random().toString(36).substring(2, 7)}`;

    const initialConditions: PodCondition[] = [
      { type: 'PodScheduled', status: 'False', reason: 'Scheduling', message: 'Waiting for scheduler placement' },
      { type: 'Initialized', status: 'True' },
      { type: 'ContainersReady', status: 'False', reason: 'ContainersNotReady', message: 'Containers are not ready yet' },
      { type: 'Ready', status: 'False', reason: 'ContainersNotReady', message: 'Pod is not ready yet' },
    ];

    const pod: K8sPod = {
      uid: podUid,
      name,
      image,
      normalizedImage: normImage,
      phase: 'Pending',
      containerState: 'Waiting',
      waitingReason: 'ContainerCreating',
      ready: false,
      conditions: initialConditions,
      nodeName: null,
      resources: {
        requests: { cpu: cpuReq, memory: memReq },
        limits: resources.limits,
      },
      age: 0,
      restarts: 0,
      ip: '',
      namespace: this.state.namespace,
      creationTimestamp: Date.now(),
    };

    this.state.pods.push(pod);

    // Step 1: kube-apiserver admission, defaulting, and schema validation
    const reqStr = cpuReq > 0 || memReq > 0 ? ` [Requests: CPU=${formatCpu(cpuReq)}, Memory=${formatMemory(memReq)}]` : ' [Requests: None]';
    this.addEvent({
      type: 'Normal',
      reason: 'Created',
      object: `pod/${name}`,
      message: `kube-apiserver accepted pod/${name} (${normImage.fullName})${reqStr}`,
      step: 'API_SERVER_VALIDATING',
      details: 'API server applied authentication, authorization, admission defaulting, and schema validation.',
    });
    eventBus.emit('POD_CREATED', { podUid, podName: name, pod });

    const scope = `pod:${podUid}`;

    // Step 2: Desired state persisted to etcd (deterministic clock)
    this.clock.schedule(180, scope, () => {
      const currentPod = this.state.pods.find((p) => p.uid === podUid);
      if (!currentPod) return;

      this.addEvent({
        type: 'Normal',
        reason: 'Persisted',
        object: `pod/${name}`,
        message: `Desired cluster state for pod/${name} persisted to etcd store.`,
        step: 'ETCD_PERSISTED',
      });
    });

    // Step 3: Trigger scheduler pipeline (deterministic clock)
    this.clock.schedule(450, scope, () => {
      const currentPod = this.state.pods.find((p) => p.uid === podUid);
      if (!currentPod) return;
      this.schedulePod(currentPod);
    });

    return {
      success: true,
      message: `pod/${name} created`,
      pod,
    };
  }

  /**
   * Evaluates scheduling for a pending pod.
   */
  public schedulePod(pod: K8sPod) {
    if (pod.phase !== 'Pending' || pod.nodeName !== null) return;

    this.addEvent({
      type: 'Normal',
      reason: 'Scheduling',
      object: `pod/${pod.name}`,
      message: `kube-scheduler evaluating candidate nodes for pod/${pod.name}...`,
      step: 'SCHEDULER_EVALUATING',
    });

    const decision = this.scheduler.evaluateNodes(pod, this.state.nodes);

    if (!decision.selectedNode) {
      pod.phase = 'Pending';
      pod.containerState = 'Waiting';
      pod.waitingReason = 'ContainerCreating';
      pod.ready = false;

      const scheduledCond = pod.conditions.find((c) => c.type === 'PodScheduled');
      if (scheduledCond) {
        scheduledCond.status = 'False';
        scheduledCond.reason = 'FailedScheduling';
        scheduledCond.message = decision.reason;
      }

      this.addEvent({
        type: 'Warning',
        reason: 'FailedScheduling',
        object: `pod/${pod.name}`,
        message: decision.reason,
        step: 'SCHEDULER_EVALUATING',
        details: decision.evaluations.map((e) => `${e.nodeName}: ${e.filterReason || 'Score ' + e.score}`).join('; '),
      });
      this.notifyListeners();
      return;
    }

    const targetNode = this.state.nodes.find((n) => n.name === decision.selectedNode!.name);
    if (!targetNode) return;

    // Bind Pod to Node
    pod.nodeName = targetNode.name;
    pod.scheduledTimestamp = Date.now();

    const reqCpu = pod.resources.requests?.cpu ?? 0;
    const reqMem = pod.resources.requests?.memory ?? 0;

    targetNode.cpuRequested += reqCpu;
    targetNode.memoryRequested += reqMem;
    if (!targetNode.pods.includes(pod.name)) {
      targetNode.pods.push(pod.name);
    }

    const scheduledCond = pod.conditions.find((c) => c.type === 'PodScheduled');
    if (scheduledCond) {
      scheduledCond.status = 'True';
      scheduledCond.reason = 'Scheduled';
      scheduledCond.message = `Successfully assigned to ${targetNode.name}`;
    }

    this.addEvent({
      type: 'Normal',
      reason: 'Scheduled',
      object: `pod/${pod.name}`,
      message: `Successfully assigned ${this.state.namespace}/${pod.name} to ${targetNode.name}`,
      step: 'SCHEDULER_BOUND',
      details: `Scheduler scores: ${decision.evaluations.map((e) => `${e.nodeName}: ${e.score}/100`).join(', ')}`,
    });
    this.notifyListeners();
    eventBus.emit('POD_SCHEDULED', { podUid: pod.uid, nodeName: targetNode.name, pod, node: targetNode });

    const scope = `pod:${pod.uid}`;

    // Step 4: Kubelet observes assignment, sets up sandbox/CNI, and starts container
    this.clock.schedule(300, scope, () => {
      const currentPod = this.state.pods.find((p) => p.uid === pod.uid);
      if (!currentPod) return;

      currentPod.containerState = 'Waiting';
      currentPod.waitingReason = 'ContainerCreating';

      this.addEvent({
        type: 'Normal',
        reason: 'Pulling',
        object: `pod/${pod.name}`,
        message: `kubelet on ${targetNode.name} pulling image "${pod.image}" via ${this.state.containerRuntime}`,
        step: 'RUNTIME_CONTAINER_STARTING',
      });
      this.notifyListeners();

      // Step 5: Container started and readiness probe passes
      this.clock.schedule(400, scope, () => {
        const livePod = this.state.pods.find((p) => p.uid === pod.uid);
        if (!livePod) return;

        livePod.phase = 'Running';
        livePod.containerState = 'Running';
        livePod.waitingReason = undefined;
        livePod.startedTimestamp = Date.now();
        const nodeIdx = this.state.nodes.findIndex((n) => n.name === targetNode.name);
        const laneNum = nodeIdx >= 0 ? nodeIdx + 1 : 1;
        livePod.ip = `10.244.${laneNum}.${Math.floor(Math.random() * 200) + 10}`;

        livePod.ready = true;
        const containersReadyCond = livePod.conditions.find((c) => c.type === 'ContainersReady');
        if (containersReadyCond) containersReadyCond.status = 'True';
        const readyCond = livePod.conditions.find((c) => c.type === 'Ready');
        if (readyCond) readyCond.status = 'True';

        this.addEvent({
          type: 'Normal',
          reason: 'Started',
          object: `pod/${pod.name}`,
          message: `Container ${pod.name} started successfully. Pod is Running & Ready on ${targetNode.name} (IP: ${livePod.ip})`,
          step: 'POD_READY',
          details: `Workload ready to serve requests on ${targetNode.name}.`,
        });
        this.notifyListeners();
        eventBus.emit('POD_READY', { podUid: livePod.uid, nodeName: targetNode.name, pod: livePod, node: targetNode });
      });
    });
  }

  /**
   * Retries scheduling for any pending pods in the cluster queue (e.g. after resources are freed).
   */
  public retryPendingPods() {
    const pendingPods = this.state.pods.filter((p) => p.phase === 'Pending' && p.nodeName === null);
    for (const pod of pendingPods) {
      this.schedulePod(pod);
    }
  }

  /**
   * Deletes a pod object from the cluster, cancelling pending clock actions, reclaiming allocated node resources,
   * and retrying pending workloads.
   */
  public deletePod(name: string): { success: boolean; message: string } {
    const index = this.state.pods.findIndex((p) => p.name === name);
    if (index === -1) {
      return {
        success: false,
        message: `Error from server (NotFound): pods "${name}" not found in namespace "${this.state.namespace}"`,
      };
    }

    const pod = this.state.pods[index];
    const podUid = pod.uid;

    // Scoped cancellation: Cancel all pending clock actions for this pod UID
    this.clock.cancelScope(`pod:${podUid}`);

    if (pod.nodeName) {
      const node = this.state.nodes.find((n) => n.name === pod.nodeName);
      if (node) {
        const reqCpu = pod.resources.requests?.cpu ?? 0;
        const reqMem = pod.resources.requests?.memory ?? 0;

        node.cpuRequested = Math.max(0, node.cpuRequested - reqCpu);
        node.memoryRequested = Math.max(0, node.memoryRequested - reqMem);
        node.pods = node.pods.filter((pName) => pName !== name);
      }
    }

    this.state.pods.splice(index, 1);

    this.addEvent({
      type: 'Normal',
      reason: 'Killing',
      object: `pod/${name}`,
      message: `Stopping container and terminating pod/${name}`,
      step: 'POD_DELETED',
    });
    this.notifyListeners();
    eventBus.emit('POD_DELETED', { podUid, podName: name });

    // Trigger retry for any pending pods waiting for resources
    this.clock.schedule(100, 'cluster:retry', () => {
      this.retryPendingPods();
    });

    return {
      success: true,
      message: `pod "${name}" deleted`,
    };
  }
}
