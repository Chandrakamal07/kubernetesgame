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
        name: 'worker-1',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2,
        memoryCapacity: 4096, // 4Gi in Mi
        cpuAllocated: 0,
        memoryAllocated: 0,
        pods: [],
        laneIndex: 0,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-1' },
        turretAngle: 0,
        ammoCount: 0,
      },
      {
        name: 'worker-2',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 4,
        memoryCapacity: 8192, // 8Gi in Mi
        cpuAllocated: 0,
        memoryAllocated: 0,
        pods: [],
        laneIndex: 1,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-2' },
        turretAngle: 0,
        ammoCount: 0,
      },
      {
        name: 'worker-3',
        role: 'worker',
        status: 'Ready',
        health: 100,
        cpuCapacity: 2,
        memoryCapacity: 2048, // 2Gi in Mi
        cpuAllocated: 0,
        memoryAllocated: 0,
        pods: [],
        laneIndex: 2,
        labels: { 'node-role.kubernetes.io/worker': '', 'topology.kubernetes.io/zone': 'lane-3' },
        turretAngle: 0,
        ammoCount: 0,
      },
    ];
  }

  private addInitialEvents() {
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-1',
      message: 'Node worker-1 status is now: NodeReady (2 CPU, 4Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-2',
      message: 'Node worker-2 status is now: NodeReady (4 CPU, 8Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
    this.addEvent({
      type: 'Normal',
      reason: 'NodeReady',
      object: 'node/worker-3',
      message: 'Node worker-3 status is now: NodeReady (2 CPU, 2Gi RAM)',
      step: 'KUBELET_OBSERVED',
    });
  }

  public getState(): ClusterState {
    return { ...this.state };
  }

  public reset(nodes?: K8sNode[], namespace = 'chapter1-level1') {
    this.state = {
      clusterName: 'k8s.training.cluster.local',
      namespace,
      nodes: nodes || this.getDefaultNodes(),
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
   */
  public createPod(
    name: string,
    image: string,
    cpuRequest: number = 0.25,
    memoryRequest: number = 256
  ): { success: boolean; message: string; pod?: K8sPod } {
    // Check if pod already exists
    if (this.state.pods.some((p) => p.name === name)) {
      return {
        success: false,
        message: `Error from server (AlreadyExists): pods "${name}" already exists`,
      };
    }

    const pod: K8sPod = {
      name,
      image,
      status: 'Pending',
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

    // Step 1: CLI Submitted & API Server validation
    this.addEvent({
      type: 'Normal',
      reason: 'Created',
      object: `pod/${name}`,
      message: `kube-apiserver accepted pod/${name} (${image}) with CPU:${cpuRequest}c, Mem:${memoryRequest}Mi`,
      step: 'API_SERVER_VALIDATING',
      details: 'Pod manifest passed OpenAPI schema validation and admission webhooks.',
    });

    // Step 2: etcd persistence
    setTimeout(() => {
      this.addEvent({
        type: 'Normal',
        reason: 'Persisted',
        object: `pod/${name}`,
        message: `pod/${name} state written to etcd key /registry/pods/${this.state.namespace}/${name}`,
        step: 'ETCD_PERSISTED',
      });
    }, 200);

    // Step 3 & 4: Kube-Scheduler evaluation & binding
    setTimeout(() => {
      this.addEvent({
        type: 'Normal',
        reason: 'Scheduling',
        object: `pod/${name}`,
        message: `kube-scheduler evaluating candidate worker nodes for pod/${name}...`,
        step: 'SCHEDULER_EVALUATING',
      });

      const decision = this.scheduler.evaluateNodes(pod, this.state.nodes);

      if (!decision.selectedNode) {
        pod.status = 'Pending';
        this.addEvent({
          type: 'Warning',
          reason: 'FailedScheduling',
          object: `pod/${name}`,
          message: decision.reason,
          step: 'SCHEDULER_EVALUATING',
          details: decision.evaluations.map((e) => `${e.nodeName}: ${e.filterReason || 'OK'}`).join('; '),
        });
        this.notifyListeners();
        return;
      }

      const targetNode = this.state.nodes.find((n) => n.name === decision.selectedNode!.name);
      if (!targetNode) return;

      pod.nodeName = targetNode.name;
      pod.laneIndex = targetNode.laneIndex;
      targetNode.cpuAllocated += pod.cpuRequest;
      targetNode.memoryAllocated += pod.memoryRequest;
      targetNode.pods.push(pod.name);

      this.addEvent({
        type: 'Normal',
        reason: 'Scheduled',
        object: `pod/${name}`,
        message: `Successfully assigned ${this.state.namespace}/${name} to ${targetNode.name}`,
        step: 'SCHEDULER_BOUND',
        details: `Scheduler score breakdown: ${decision.evaluations.map((e) => `${e.nodeName}: ${e.score}/100`).join(', ')}`,
      });
      this.notifyListeners();

      // Step 5 & 6: Kubelet and CRI-O container startup
      setTimeout(() => {
        pod.status = 'ContainerCreating';
        this.addEvent({
          type: 'Normal',
          reason: 'Pulling',
          object: `pod/${name}`,
          message: `kubelet on ${targetNode.name} pulling image "${image}" via CRI-O`,
          step: 'CRIO_CONTAINER_STARTING',
        });
        this.notifyListeners();

        setTimeout(() => {
          pod.status = 'Running';
          pod.ip = `10.128.${targetNode.laneIndex + 1}.${Math.floor(Math.random() * 200) + 10}`;
          
          // Pod is RUNNING -> Load ammunition on node cannon!
          targetNode.ammoCount += 1;
          targetNode.isCharging = true;

          this.addEvent({
            type: 'Normal',
            reason: 'Started',
            object: `pod/${name}`,
            message: `Container ${name} started successfully. Pod is now Running on ${targetNode.name}! Defense cannon loaded!`,
            step: 'POD_RUNNING',
            details: `Workload active on IP ${pod.ip}. Defensive capacity generated.`,
          });
          this.notifyListeners();

          setTimeout(() => {
            if (targetNode) targetNode.isCharging = false;
            this.notifyListeners();
          }, 600);
        }, 1200);
      }, 700);
    }, 600);

    return {
      success: true,
      message: `pod/${name} created`,
      pod,
    };
  }

  public deletePod(name: string): { success: boolean; message: string } {
    const index = this.state.pods.findIndex((p) => p.name === name);
    if (index === -1) {
      return {
        success: false,
        message: `Error from server (NotFound): pods "${name}" not found`,
      };
    }

    const pod = this.state.pods[index];
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
      message: `Stopping container and terminating pod/${name}`,
      step: 'POD_DELETED',
    });
    this.notifyListeners();

    return {
      success: true,
      message: `pod "${name}" deleted`,
    };
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
        message: `ALERT: Node ${node.name} has suffered severe request pressure! Status: NotReady`,
      });
    } else {
      this.addEvent({
        type: 'Warning',
        reason: 'NodePressure',
        object: `node/${node.name}`,
        message: `Node ${node.name} took damage from unhandled customer request! Health: ${node.health}%`,
      });
    }

    const workerNodes = this.state.nodes.filter((n) => n.role === 'worker');
    const totalHealth = workerNodes.reduce((acc, n) => acc + n.health, 0);
    this.state.health = Math.round(totalHealth / workerNodes.length);

    this.state.slaStreak = 0;
    this.notifyListeners();
  }

  public consumeAmmo(laneIndex: number): boolean {
    const node = this.state.nodes.find((n) => n.laneIndex === laneIndex);
    if (node && node.ammoCount > 0) {
      node.ammoCount -= 1;
      node.lastFiredTimestamp = Date.now();
      this.notifyListeners();
      return true;
    }
    return false;
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
