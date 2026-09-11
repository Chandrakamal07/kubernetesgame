export type NodeRole = 'worker' | 'master' | 'control-plane';
export type NodeStatus = 'Ready' | 'NotReady';

export interface K8sNode {
  name: string;
  role: NodeRole;
  status: NodeStatus;
  health: number; // 0 - 100%
  cpuCapacity: number; // in cores, e.g. 2, 4
  memoryCapacity: number; // in Mi, e.g. 4096, 8192
  cpuAllocated: number; // in cores, e.g. 0.5
  memoryAllocated: number; // in Mi, e.g. 512
  pods: string[]; // pod names
  laneIndex: number; // 0, 1, 2 for worker-1, worker-2, worker-3
  labels: Record<string, string>;
  turretAngle: number; // for canvas rendering
  isCharging?: boolean;
  ammoCount: number; // shells loaded
  lastFiredTimestamp?: number;
}

export type PodStatus = 
  | 'Pending' 
  | 'ContainerCreating' 
  | 'Running' 
  | 'Completed' 
  | 'Failed' 
  | 'Terminating';

export interface K8sPod {
  name: string;
  image: string;
  status: PodStatus;
  nodeName: string | null;
  cpuRequest: number; // cores, e.g. 0.25 (250m)
  memoryRequest: number; // Mi, e.g. 256
  age: number; // seconds
  restarts: number;
  ip: string;
  namespace: string;
  creationTimestamp: number;
  satisfiesRequestId?: string;
  laneIndex?: number;
}

export type ControlPlaneStep = 
  | 'CLI_SUBMITTED'
  | 'API_SERVER_VALIDATING'
  | 'ETCD_PERSISTED'
  | 'SCHEDULER_EVALUATING'
  | 'SCHEDULER_BOUND'
  | 'KUBELET_OBSERVED'
  | 'CRIO_CONTAINER_STARTING'
  | 'POD_RUNNING'
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
