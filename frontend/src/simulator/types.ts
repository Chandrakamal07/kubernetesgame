export type NodeRole = 'worker' | 'control-plane' | 'master';
export type NodeStatus = 'Ready' | 'NotReady';

export interface Taint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

export interface Toleration {
  key?: string;
  operator?: 'Exists' | 'Equal';
  value?: string;
  effect?: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

export interface NodeCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: 'True' | 'False' | 'Unknown';
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
  reason: string;
  message: string;
}

export interface K8sNode {
  name: string;
  role: NodeRole;
  status: NodeStatus;
  unschedulable?: boolean;
  taints?: Taint[];
  conditions?: NodeCondition[];
  health: number; // 0 - 100% (Fictional game defense integrity)
  cpuCapacity: number; // in cores, e.g. 2.0, 4.0
  memoryCapacity: number; // in Mi, e.g. 4096, 8192
  cpuAllocatable: number; // in cores, e.g. 1.8, 3.8 (Capacity minus system-reserved/kube-reserved)
  memoryAllocatable: number; // in Mi, e.g. 3584, 7680
  cpuRequested: number; // Sum of scheduled Pod CPU requests (in cores)
  memoryRequested: number; // Sum of scheduled Pod Memory requests (in Mi)
  cpuUsage?: number; // Real-time CPU usage (for monitoring)
  memoryUsage?: number; // Real-time Memory usage (for monitoring)
  pods: string[]; // pod names bound to this node
  laneIndex: number; // 0, 1, 2 for worker-1, worker-2, worker-3
  labels: Record<string, string>;
  turretAngle: number; // For battlefield canvas rendering (radians)
  isCharging?: boolean;
  serviceCapacity: number; // Defenses provided by active running workloads
  lastFiredTimestamp?: number;
}

export type PodPhase = 
  | 'Pending' 
  | 'Running' 
  | 'Succeeded' 
  | 'Failed' 
  | 'Unknown';

export type PodLifecycleStatus = 
  | 'Pending' 
  | 'ContainerCreating' 
  | 'Running' 
  | 'Terminating' 
  | 'Failed' 
  | 'Succeeded';

export interface PodCondition {
  type: 'PodScheduled' | 'Initialized' | 'ContainersReady' | 'Ready';
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface ResourceRequirements {
  requests?: {
    cpu?: number; // cores, e.g. 0.25 (250m)
    memory?: number; // Mi, e.g. 256
  };
  limits?: {
    cpu?: number;
    memory?: number;
  };
}

export interface NormalizedImage {
  registry: string;
  repository: string;
  tag: string;
  fullName: string;
}

export interface K8sPod {
  name: string;
  image: string;
  normalizedImage: NormalizedImage;
  phase: PodPhase;
  status: PodLifecycleStatus;
  ready: boolean;
  conditions: PodCondition[];
  nodeName: string | null;
  resources: ResourceRequirements;
  tolerations?: Toleration[];
  age: number; // seconds
  restarts: number;
  ip: string;
  namespace: string;
  creationTimestamp: number;
  scheduledTimestamp?: number;
  startedTimestamp?: number;
  satisfiesRequestId?: string;
  laneIndex?: number;
  ownerReferences?: {
    kind: string;
    name: string;
    uid: string;
  }[];
}

export type ControlPlaneStep = 
  | 'CLI_SUBMITTED'
  | 'API_SERVER_VALIDATING'
  | 'ETCD_PERSISTED'
  | 'SCHEDULER_EVALUATING'
  | 'SCHEDULER_BOUND'
  | 'KUBELET_OBSERVED'
  | 'RUNTIME_CONTAINER_STARTING'
  | 'POD_RUNNING'
  | 'POD_READY'
  | 'POD_TERMINATING'
  | 'POD_DELETED';

export interface ClusterEvent {
  id: string;
  timestamp: string;
  timeSeconds: number;
  type: 'Normal' | 'Warning';
  reason: string;
  object: string;
  message: string;
  step?: ControlPlaneStep;
  details?: string;
}

export interface ClusterState {
  clusterName: string;
  namespace: string;
  containerRuntime: 'containerd' | 'cri-o';
  podCIDR: string;
  nodes: K8sNode[];
  pods: K8sPod[];
  events: ClusterEvent[];
  health: number; // 0 - 100%
  score: number;
  slaStreak: number;
  maxSlaStreak: number;
  requestsCompleted: number;
  requestsFailed: number;
  hintsUsedCount: number;
}
