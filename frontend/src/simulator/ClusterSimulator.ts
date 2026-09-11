import type {
  ClusterEvent,
  ClusterState,
  K8sNode,
  K8sPod,
  PodCondition,
  ResourceRequirements,
} from './types.ts';
import { KubeScheduler } from './Scheduler.ts';
import { formatCpu, formatMemory, normalizeImage } from './imageUtils.ts';
import { eventBus } from '../engine/GameEventBus.ts';

export type ClusterListener = (state: ClusterState, latestEvent?: ClusterEvent) => void;

export class ClusterSimulator {
  private state: ClusterState;
  private scheduler: KubeScheduler;
  private listeners: Set<ClusterListener> = new Set();
  private startTime: number = Date.now();
  private epoch: number = 0;

  constructor(initialNodes?: K8sNode[]) {
    this.scheduler = new KubeScheduler();
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace: 'chapter1-level1',
      containerRuntime: 'containerd',
      podCIDR: '10.244.0.0/16',
      nodes: initialNodes || this.getDefaultNodes(),
      pods: [],
      events: [],
      health: 100,
      score: 0,
      slaStreak: 0,
      maxSlaStreak: 0,
      requestsCompleted: 0,
      requestsFailed: 0,
      hintsUsedCount: 0,
    };
    this.addInitialEvents();
  }

  public getDefaultNodes(): K8sNode[] {
    return [
      {
        name: 'worker-1',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2.0,
        memoryCapacity: 4096, // 4Gi in Mi
        cpuAllocatable: 1.8, // Capacity minus kube-reserved/system-reserved
        memoryAllocatable: 3584, // 3.5Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        laneIndex: 0,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-1' },
        turretAngle: 0,
        serviceCapacity: 0,
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
        ],
      },
      {
        name: 'worker-2',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 4.0,
        memoryCapacity: 8192, // 8Gi in Mi
        cpuAllocatable: 3.8,
        memoryAllocatable: 7680, // 7.5Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        laneIndex: 1,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-2' },
        turretAngle: 0,
        serviceCapacity: 0,
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
        ],
      },
      {
        name: 'worker-3',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2.0,
        memoryCapacity: 2048, // 2Gi in Mi
        cpuAllocatable: 1.8,
        memoryAllocatable: 1792, // 1.75Gi allocatable
        cpuRequested: 0,
        memoryRequested: 0,
        pods: [],
        laneIndex: 2,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-3' },
        turretAngle: 0,
        serviceCapacity: 0,
        conditions: [
          { type: 'Ready', status: 'True', reason: 'KubeletReady', message: 'kubelet is posting ready status' },
          { type: 'MemoryPressure', status: 'False', reason: 'KubeletHasSufficientMemory', message: 'kubelet has sufficient memory available' },
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

  public getState(): ClusterState {
    return { ...this.state };
  }

  public reset(nodes?: K8sNode[], namespace = 'chapter1-level1') {
    this.epoch += 1;
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace,
      containerRuntime: 'containerd',
      podCIDR: '10.244.0.0/16',
      nodes: nodes ? JSON.parse(JSON.stringify(nodes)) : this.getDefaultNodes(),
      pods: [],
      events: [],
      health: 100,
      score: 0,
      slaStreak: 0,
      maxSlaStreak: 0,
      requestsCompleted: 0,
      requestsFailed: 0,
      hintsUsedCount: 0,
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
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState, latestEvent));
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
   * Phase 2: Asynchronously schedules, pulls image, starts container, and reaches Ready status.
   */
  public createPod(
    name: string,
    image: string,
    resources: ResourceRequirements = { requests: { cpu: 0.25, memory: 256 } }
  ): { success: boolean; message: string; pod?: K8sPod } {
    // Check if pod already exists in namespace
    if (this.state.pods.some((p) => p.name === name)) {
      return {
        success: false,
        message: `Error from server (AlreadyExists): pods "${name}" already exists in namespace "${this.state.namespace}"`,
      };
    }

    const normImage = normalizeImage(image);
    const cpuReq = resources.requests?.cpu ?? 0.25;
    const memReq = resources.requests?.memory ?? 256;

    const initialConditions: PodCondition[] = [
      { type: 'PodScheduled', status: 'False', reason: 'Scheduling', message: 'Waiting for scheduler placement' },
      { type: 'Initialized', status: 'True' },
      { type: 'ContainersReady', status: 'False', reason: 'ContainersNotReady', message: 'Containers are not ready yet' },
      { type: 'Ready', status: 'False', reason: 'ContainersNotReady', message: 'Pod is not ready yet' },
    ];

    const pod: K8sPod = {
      name,
      image,
      normalizedImage: normImage,
      phase: 'Pending',
      status: 'Pending',
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
    this.addEvent({
      type: 'Normal',
      reason: 'Created',
      object: `pod/${name}`,
      message: `kube-apiserver accepted pod/${name} (${normImage.fullName}) [Requests: CPU=${formatCpu(cpuReq)}, Memory=${formatMemory(memReq)}]`,
      step: 'API_SERVER_VALIDATING',
      details: 'API server applied authentication, authorization, admission defaulting, and schema validation.',
    });
    eventBus.emit('POD_CREATED', { pod });

    const curEpoch = this.epoch;

    // Step 2: Desired state persisted to etcd
    setTimeout(() => {
      if (this.epoch !== curEpoch) return;
      this.addEvent({
        type: 'Normal',
        reason: 'Persisted',
        object: `pod/${name}`,
        message: `Desired cluster state for pod/${name} persisted to etcd store.`,
        step: 'ETCD_PERSISTED',
      });
    }, 180);

    // Step 3: Trigger scheduler pipeline
    setTimeout(() => {
      if (this.epoch !== curEpoch) return;
      this.schedulePod(pod);
    }, 450);

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
      pod.status = 'Pending';
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
    pod.laneIndex = targetNode.laneIndex;
    pod.scheduledTimestamp = Date.now();

    const reqCpu = pod.resources.requests?.cpu ?? 0.25;
    const reqMem = pod.resources.requests?.memory ?? 256;

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
    eventBus.emit('POD_SCHEDULED', { pod, node: targetNode });

    const curEpoch = this.epoch;

    // Step 4: Kubelet observes assignment, sets up sandbox/CNI, and starts container
    setTimeout(() => {
      if (this.epoch !== curEpoch) return;
      pod.status = 'ContainerCreating';
      this.addEvent({
        type: 'Normal',
        reason: 'Pulling',
        object: `pod/${pod.name}`,
        message: `kubelet on ${targetNode.name} pulling image "${pod.image}" via ${this.state.containerRuntime}`,
        step: 'RUNTIME_CONTAINER_STARTING',
      });
      this.notifyListeners();

      setTimeout(() => {
        if (this.epoch !== curEpoch) return;
        // Container runtime starts workload
        pod.phase = 'Running';
        pod.status = 'Running';
        pod.startedTimestamp = Date.now();
        pod.ip = `10.244.${targetNode.laneIndex + 1}.${Math.floor(Math.random() * 200) + 10}`;

        // Readiness probe succeeds
        pod.ready = true;
        const containersReadyCond = pod.conditions.find((c) => c.type === 'ContainersReady');
        if (containersReadyCond) containersReadyCond.status = 'True';
        const readyCond = pod.conditions.find((c) => c.type === 'Ready');
        if (readyCond) readyCond.status = 'True';

        // Worker node service capacity active
        targetNode.serviceCapacity += 1;
        targetNode.isCharging = true;

        this.addEvent({
          type: 'Normal',
          reason: 'Started',
          object: `pod/${pod.name}`,
          message: `Container ${pod.name} started successfully. Pod is Running & Ready on ${targetNode.name} (IP: ${pod.ip})`,
          step: 'POD_READY',
          details: `Workload ready to serve requests. Defenses charged on ${targetNode.name}.`,
        });
        this.notifyListeners();
        eventBus.emit('POD_READY', { pod, node: targetNode });

        setTimeout(() => {
          if (this.epoch !== curEpoch) return;
          if (targetNode) targetNode.isCharging = false;
          this.notifyListeners();
        }, 500);
      }, 1000);
    }, 600);
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
   * Deletes a pod object from the cluster, reclaiming allocated node resources and retrying pending workloads.
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
    if (pod.nodeName) {
      const node = this.state.nodes.find((n) => n.name === pod.nodeName);
      if (node) {
        const reqCpu = pod.resources.requests?.cpu ?? 0.25;
        const reqMem = pod.resources.requests?.memory ?? 256;

        node.cpuRequested = Math.max(0, node.cpuRequested - reqCpu);
        node.memoryRequested = Math.max(0, node.memoryRequested - reqMem);
        node.pods = node.pods.filter((pName) => pName !== name);
        node.serviceCapacity = Math.max(0, node.serviceCapacity - 1);
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
    eventBus.emit('POD_DELETED', { podName: name });

    const curEpoch = this.epoch;
    // Trigger retry for any pending pods waiting for resources
    setTimeout(() => {
      if (this.epoch !== curEpoch) return;
      this.retryPendingPods();
    }, 200);

    return {
      success: true,
      message: `pod "${name}" deleted`,
    };
  }

  /**
   * Applies simulated game damage to a node when unhandled customer requests breach SLA.
   */
  public damageNode(laneIndex: number, amount: number = 20) {
    const node = this.state.nodes.find((n) => n.laneIndex === laneIndex);
    if (!node) return;

    node.health = Math.max(0, node.health - amount);
    if (node.health <= 0) {
      node.status = 'NotReady';
      this.addEvent({
        type: 'Warning',
        reason: 'NodeNotReady',
        object: `node/${node.name}`,
        message: `ALERT: Node ${node.name} status transitioned to: NotReady (kubelet unresponsive under request flood)`,
      });
    } else {
      this.addEvent({
        type: 'Warning',
        reason: 'NodePressure',
        object: `node/${node.name}`,
        message: `Node ${node.name} suffered request pressure. Defense Health: ${node.health}%`,
      });
    }

    const workerNodes = this.state.nodes.filter((n) => n.role === 'worker');
    const totalHealth = workerNodes.reduce((acc, n) => acc + n.health, 0);
    this.state.health = Math.round(totalHealth / workerNodes.length);

    this.state.slaStreak = 0;
    this.notifyListeners();
  }

  public updateScore(points: number, isSuccess = true) {
    if (isSuccess) {
      this.state.score += points;
      this.state.slaStreak += 1;
      if (this.state.slaStreak > this.state.maxSlaStreak) {
        this.state.maxSlaStreak = this.state.slaStreak;
      }
      this.state.requestsCompleted += 1;
    } else {
      this.state.slaStreak = 0;
      this.state.requestsFailed += 1;
    }
    this.notifyListeners();
  }

  public recordHintUsed(deduction: number) {
    this.state.hintsUsedCount += 1;
    this.state.score = Math.max(0, this.state.score - deduction);
    this.notifyListeners();
  }
}
