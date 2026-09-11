export type NodeRole = 'worker' | 'master' | 'control-plane';
export type NodeStatus = 'Ready' | 'NotReady';

export interface K8sTaint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

export interface K8sNode {
  name: string;
  role: NodeRole;
  status: NodeStatus;
  health: number; // fictional game/SLA health, separate from Kubernetes Ready condition
  cpuCapacity: number; // physical/logical capacity in cores
  memoryCapacity: number; // physical/logical capacity in Mi
  cpuAllocatable?: number; // resources available to Pods after system reservations
  memoryAllocatable?: number; // resources available to Pods after system reservations
  cpuAllocated: number; // sum of scheduled Pod CPU requests
  memoryAllocated: number; // sum of scheduled Pod memory requests
  pods: string[]; // pod names
  laneIndex: number; // visual/gameplay lane only; not a scheduler constraint
  labels: Record<string, string>;
  unschedulable?: boolean;
  taints?: K8sTaint[];
  turretAngle: number; // for canvas rendering
  isCharging?: boolean;
  ammoCount: number; // visual defense capacity only; Pods themselves are not consumed
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
  ready: boolean;
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
  health: number; // fictional aggregate game/SLA health, 0 - 100%
  score: number;
  slaStreak: number;
  maxSlaStreak: number;
  requestsCompleted: number;
  requestsFailed: number;
  hintsUsedCount: number;
}
