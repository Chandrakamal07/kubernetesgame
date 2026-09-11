import type { ClusterEvent, ClusterState, K8sNode, K8sPod } from './types';
import { KubeScheduler } from './Scheduler';

export type ClusterListener = (state: ClusterState, latestEvent?: ClusterEvent) => void;

export class ClusterSimulator {
  private state: ClusterState;
  private scheduler: KubeScheduler;
  private listeners: Set<ClusterListener> = new Set();
  private startTime: number = Date.now();

  constructor(initialNodes?: K8sNode[]) {
    this.scheduler = new KubeScheduler();
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace: 'chapter1-level1',
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
        name: 'worker-1', role: 'worker', status: 'Ready', health: 100,
        cpuCapacity: 2, memoryCapacity: 4096, cpuAllocatable: 1.8, memoryAllocatable: 3584,
        cpuAllocated: 0, memoryAllocated: 0, pods: [], laneIndex: 0,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-1' },
        turretAngle: 0, ammoCount: 0,
      },
      {
        name: 'worker-2', role: 'worker', status: 'Ready', health: 100,
        cpuCapacity: 4, memoryCapacity: 8192, cpuAllocatable: 3.6, memoryAllocatable: 7168,
        cpuAllocated: 0, memoryAllocated: 0, pods: [], laneIndex: 1,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-2' },
        turretAngle: 0, ammoCount: 0,
      },
      {
        name: 'worker-3', role: 'worker', status: 'Ready', health: 100,
        cpuCapacity: 2, memoryCapacity: 2048, cpuAllocatable: 1.8, memoryAllocatable: 1792,
        cpuAllocated: 0, memoryAllocated: 0, pods: [], laneIndex: 2,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-3' },
        turretAngle: 0, ammoCount: 0,
      },
    ];
  }

  private addInitialEvents() {
    for (const node of this.state.nodes) {
      this.addEvent({
        type: 'Normal',
        reason: 'NodeReady',
        object: `node/${node.name}`,
        message: `Node ${node.name} status is now: NodeReady`,
        step: 'KUBELET_OBSERVED',
        details: `Capacity ${node.cpuCapacity} CPU/${node.memoryCapacity}Mi; Allocatable ${node.cpuAllocatable ?? node.cpuCapacity} CPU/${node.memoryAllocatable ?? node.memoryCapacity}Mi`,
      });
    }
  }

  public getState(): ClusterState {
    return {
      ...this.state,
      nodes: this.state.nodes.map((node) => ({ ...node, pods: [...node.pods], labels: { ...node.labels } })),
      pods: this.state.pods.map((pod) => ({ ...pod })),
      events: [...this.state.events],
    };
  }

  public reset(nodes?: K8sNode[], namespace = 'chapter1-level1') {
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace,
      nodes: (nodes || this.getDefaultNodes()).map((node) => ({ ...node, pods: [...node.pods], labels: { ...node.labels } })),
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
    const fullEvent: ClusterEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: date.toTimeString().split(' ')[0],
      timeSeconds: elapsedSeconds,
    };

    this.state.events = [fullEvent, ...this.state.events.slice(0, 49)];
    this.notifyListeners(fullEvent);
    return fullEvent;
  }

  /** Create desired Pod state. Command acceptance is deliberately separate from workload readiness. */
  public createPod(
    name: string,
    image: string,
    cpuRequest: number = 0.25,
    memoryRequest: number = 256,
  ): { success: boolean; message: string; pod?: K8sPod } {
    if (this.state.pods.some((p) => p.name === name)) {
      return { success: false, message: `Error from server (AlreadyExists): pods "${name}" already exists` };
    }

    const pod: K8sPod = {
      name,
      image,
      status: 'Pending',
      ready: false,
      nodeName: null,
      cpuRequest,
      memoryRequest,
      age: 0,
      restarts: 0,
      ip: '',
      namespace: this.state.namespace,
      creationTimestamp: Date.now(),
    };
    this.state.pods.push(pod);

    this.addEvent({
      type: 'Normal',
      reason: 'Created',
      object: `pod/${name}`,
      message: `kube-apiserver accepted pod/${name} (${image}) with CPU:${cpuRequest}c, Mem:${memoryRequest}Mi`,
      step: 'API_SERVER_VALIDATING',
      details: 'Request authenticated/authorized, processed by admission, defaulted and validated before persistence.',
    });

    setTimeout(() => {
      if (!this.state.pods.includes(pod)) return;
      this.addEvent({
        type: 'Normal',
        reason: 'Persisted',
        object: `pod/${name}`,
        message: `API server persisted desired state for pod/${name} to the cluster state store (etcd).`,
        step: 'ETCD_PERSISTED',
      });
      this.schedulePod(pod);
    }, 200);

    return { success: true, message: `pod/${name} created`, pod };
  }

  private schedulePod(pod: K8sPod) {
    if (!this.state.pods.includes(pod) || pod.nodeName || pod.status !== 'Pending') return;

    setTimeout(() => {
      if (!this.state.pods.includes(pod) || pod.nodeName || pod.status !== 'Pending') return;
      this.addEvent({
        type: 'Normal',
        reason: 'Scheduling',
        object: `pod/${pod.name}`,
        message: `kube-scheduler evaluating eligible nodes for pod/${pod.name}...`,
        step: 'SCHEDULER_EVALUATING',
      });

      const decision = this.scheduler.evaluateNodes(pod, this.state.nodes);
      if (!decision.selectedNode) {
        pod.ready = false;
        this.addEvent({
          type: 'Warning',
          reason: 'FailedScheduling',
          object: `pod/${pod.name}`,
          message: decision.reason,
          step: 'SCHEDULER_EVALUATING',
          details: decision.evaluations.map((e) => `${e.nodeName}: ${e.filterReason || `score ${e.score}`}`).join('; '),
        });
        return;
      }

      const targetNode = this.state.nodes.find((n) => n.name === decision.selectedNode!.name);
      if (!targetNode) return;

      pod.nodeName = targetNode.name;
      pod.laneIndex = targetNode.laneIndex; // visual location of the selected Node, not a scheduler input
      targetNode.cpuAllocated += pod.cpuRequest;
      targetNode.memoryAllocated += pod.memoryRequest;
      targetNode.pods.push(pod.name);

      this.addEvent({
        type: 'Normal',
        reason: 'Scheduled',
        object: `pod/${pod.name}`,
        message: `Successfully assigned ${this.state.namespace}/${pod.name} to ${targetNode.name}`,
        step: 'SCHEDULER_BOUND',
        details: `Training scheduler scores: ${decision.evaluations.map((e) => `${e.nodeName}: ${e.passedFilter ? `${e.score}/100` : e.filterReason}`).join(', ')}`,
      });

      setTimeout(() => {
        if (!this.state.pods.includes(pod)) return;
        pod.status = 'ContainerCreating';
        pod.ready = false;
        this.addEvent({
          type: 'Normal',
          reason: 'Pulling',
          object: `pod/${pod.name}`,
          message: `kubelet on ${targetNode.name} is preparing the Pod sandbox and pulling image "${pod.image}" through the container runtime`,
          step: 'CRIO_CONTAINER_STARTING',
        });

        setTimeout(() => {
          if (!this.state.pods.includes(pod)) return;
          pod.status = 'Running';
          pod.ready = true;
          pod.ip = `10.244.${targetNode.laneIndex + 1}.${Math.floor(Math.random() * 200) + 10}`;
          targetNode.ammoCount += 1;
          targetNode.isCharging = true;

          this.addEvent({
            type: 'Normal',
            reason: 'Started',
            object: `pod/${pod.name}`,
            message: `Container ${pod.name} started successfully. Pod is Running and Ready on ${targetNode.name}.`,
            step: 'POD_RUNNING',
            details: `Workload is Ready on IP ${pod.ip}; the game can now use this healthy workload to serve its matching request.`,
          });

          setTimeout(() => {
            targetNode.isCharging = false;
            this.notifyListeners();
          }, 600);
        }, 1200);
      }, 700);
    }, 400);
  }

  private retryPendingPods() {
    this.state.pods
      .filter((pod) => pod.status === 'Pending' && !pod.nodeName)
      .forEach((pod) => this.schedulePod(pod));
  }

  public deletePod(name: string): { success: boolean; message: string } {
    const index = this.state.pods.findIndex((p) => p.name === name);
    if (index === -1) {
      return { success: false, message: `Error from server (NotFound): pods "${name}" not found` };
    }

    const pod = this.state.pods[index];
    pod.status = 'Terminating';
    pod.ready = false;

    if (pod.nodeName) {
      const node = this.state.nodes.find((n) => n.name === pod.nodeName);
      if (node) {
        node.cpuAllocated = Math.max(0, node.cpuAllocated - pod.cpuRequest);
        node.memoryAllocated = Math.max(0, node.memoryAllocated - pod.memoryRequest);
        node.pods = node.pods.filter((pName) => pName !== name);
        node.ammoCount = Math.max(0, node.ammoCount - 1);
      }
    }

    this.state.pods.splice(index, 1);
    this.addEvent({
      type: 'Normal',
      reason: 'Killing',
      object: `pod/${name}`,
      message: `Pod ${name} terminated; its requested resources are now available for future scheduling decisions.`,
      step: 'POD_DELETED',
    });

    this.retryPendingPods();
    return { success: true, message: `pod "${name}" deleted` };
  }

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
        message: `Simulation incident: ${node.name} has been forced NotReady after game/SLA health reached zero.`,
        details: 'Game health is fictional. Kubernetes NodeReady normally reflects kubelet/node health, not customer traffic directly.',
      });
    } else {
      this.addEvent({
        type: 'Warning',
        reason: 'SLABreach',
        object: `node/${node.name}`,
        message: `Unhandled request breached the defense lane. Game health for ${node.name}: ${node.health}%`,
        details: 'This health value is a game metric and is separate from Kubernetes Node conditions.',
      });
    }

    const gameNodes = this.state.nodes.filter((n) => n.role === 'worker');
    this.state.health = Math.round(gameNodes.reduce((acc, n) => acc + n.health, 0) / Math.max(gameNodes.length, 1));
    this.state.slaStreak = 0;
    this.notifyListeners();
  }

  public consumeAmmo(laneIndex: number): boolean {
    const node = this.state.nodes.find((n) => n.laneIndex === laneIndex);
    if (node && node.ammoCount > 0) {
      node.lastFiredTimestamp = Date.now();
      // Keep the workload/capacity alive after a visual shot; a Running Pod is not consumable ammunition.
      this.notifyListeners();
      return true;
    }
    return false;
  }

  public updateScore(points: number, isSuccess = true) {
    if (isSuccess) {
      this.state.score += points;
      this.state.slaStreak += 1;
      this.state.maxSlaStreak = Math.max(this.state.maxSlaStreak, this.state.slaStreak);
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
