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

/**
 * Authentic Kubernetes v1.30.0 Node representation.
 * Fictional presentation metrics (health, turretAngle, serviceCapacity) are decoupled.
 */
export interface K8sNode {
  uid: string;
  name: string;
  role: NodeRole;
  status: NodeStatus;
  unschedulable?: boolean;
  taints?: Taint[];
  conditions: NodeCondition[];
  cpuCapacity: number; // in cores, e.g. 2.0, 4.0
  memoryCapacity: number; // in Mi, e.g. 4096, 8192
  cpuAllocatable: number; // in cores, e.g. 1.8, 3.8 (Capacity minus system/kube reserves)
  memoryAllocatable: number; // in Mi, e.g. 3584, 7680
  cpuRequested: number; // Sum of bound Pod CPU requests (in cores)
  memoryRequested: number; // Sum of bound Pod Memory requests (in Mi)
  pods: string[]; // Pod names bound to this node
  labels: Record<string, string>;
}

/**
 * Formal Kubernetes Pod Phase definitions (RFC / Upstream k8s v1.30.0).
 */
export type PodPhase = 
  | 'Pending' 
  | 'Running' 
  | 'Succeeded' 
  | 'Failed' 
  | 'Unknown';

/**
 * Container execution states.
 */
export type ContainerState = 'Waiting' | 'Running' | 'Terminated';

/**
 * Container waiting/diagnostic reasons shown by kubectl.
 */
export type ContainerWaitingReason = 
  | 'ContainerCreating' 
  | 'CrashLoopBackOff' 
  | 'ImagePullBackOff' 
  | 'ErrImagePull';

export interface PodCondition {
  type: 'PodScheduled' | 'Initialized' | 'ContainersReady' | 'Ready';
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface ResourceRequirements {
  requests?: {
    cpu?: number; // cores, e.g. 0.25 (250m) or 0 (explicit zero)
    memory?: number; // Mi, e.g. 256 or 0
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
  digest?: string;
}

export interface K8sPod {
  uid: string;
  name: string;
  image: string;
  normalizedImage: NormalizedImage;
  phase: PodPhase;
  containerState: ContainerState;
  waitingReason?: ContainerWaitingReason;
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

/**
 * Authoritative Kubernetes Cluster State Domain
 */
export interface KubernetesClusterState {
  clusterName: string;
  namespace: string;
  containerRuntime: 'containerd' | 'cri-o';
  podCIDR: string;
  nodes: K8sNode[];
  pods: K8sPod[];
  events: ClusterEvent[];
}

/**
 * Legacy compatibility alias for ClusterState
 */
export type ClusterState = KubernetesClusterState;
