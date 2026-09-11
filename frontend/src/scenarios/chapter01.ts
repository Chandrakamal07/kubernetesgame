import type { ChapterConfig, LevelConfig } from './types';
import type { K8sNode } from '../simulator/types';

const createTrainingNodes = (): K8sNode[] => [
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

const cpuOverrides = `{"spec":{"containers":[{"name":"compute-01","image":"nginx","resources":{"requests":{"cpu":"500m"}}}]}}`;
const memoryOverrides = `{"spec":{"containers":[{"name":"db-01","image":"redis","resources":{"requests":{"memory":"1024Mi"}}}]}}`;
const gatewayOverrides = `{"spec":{"containers":[{"name":"gateway-01","image":"nginx","resources":{"requests":{"cpu":"1000m","memory":"2048Mi"}}}]}}`;

export const tutorialLevel: LevelConfig = {
  id: 0,
  chapterId: 1,
  title: 'Tutorial: Cluster Boot & Basics',
  subtitle: 'Academy Simulation • Guided Introduction',
  description: 'Learn the basic game loop while preserving real Kubernetes behavior: inspect nodes, create desired state, then wait for the workload to become Ready.',
  initialNodes: createTrainingNodes(),
  requests: [
    {
      id: 'tut-001', customerName: 'Training Supervisor', customerRole: 'Kubernetes Instructor', characterType: 'normal',
      title: 'Inspect Worker Nodes', description: 'Verify that the cluster nodes are Ready before placing workloads.',
      requirements: { type: 'inspect-nodes' }, lane: 0, slaTimeSeconds: 120, rewardPoints: 100,
      hints: ['List the Nodes in the cluster.', "Use kubectl's get command.", 'The resource type is nodes.', 'Execute: kubectl get nodes'],
      learningNote: 'Ready is a Kubernetes Node condition. The game health meter is separate from Kubernetes Node readiness.',
    },
    {
      id: 'tut-002', customerName: 'Workload Generator', customerRole: 'Training Request', characterType: 'normal',
      title: 'Deploy NGINX Pod', description: 'Create web-01 from nginx. The request is served only after the Pod becomes Running and Ready.',
      requirements: { type: 'create-pod', podName: 'web-01', image: 'nginx' }, lane: 1, slaTimeSeconds: 90, rewardPoints: 150,
      hints: ['Create a Pod named web-01.', 'Use kubectl run for this simple Pod.', 'Specify the nginx image.', 'Execute: kubectl run web-01 --image=nginx'],
      learningNote: 'kubectl can create the Pod object immediately, but the scheduler and kubelet still need time to make the workload Ready.',
    },
  ],
  learningOutcomes: [
    'Node Ready status and fictional game health are different concepts.',
    'A successful kubectl create/run response means the API accepted desired state; it does not mean the workload is already Ready.',
    'The scheduler selects an eligible Node independently of the customer lane.',
    'A healthy Running/Ready workload provides defense capacity without being consumed like ammunition.',
  ],
};

export const chapter01Levels: LevelConfig[] = [
  {
    id: 1,
    chapterId: 1,
    title: 'Level 1: Nodes & Scheduling',
    subtitle: 'Cluster Architecture, Placement & Resource Requests',
    description: 'Learn how Pods move from desired state to scheduled, Running and Ready workloads.',
    initialNodes: createTrainingNodes(),
    requests: [
      {
        id: 'req-001', customerName: 'Sarah Jenkins', customerRole: 'Cluster Architect', characterType: 'normal',
        title: 'Inspect Cluster Workers', description: 'Verify that the available Nodes are Ready.',
        requirements: { type: 'inspect-nodes' }, lane: 0, slaTimeSeconds: 90, rewardPoints: 100,
        hints: ['List the cluster Nodes.', 'Use kubectl get.', 'Resource type: nodes.', 'Execute: kubectl get nodes'],
        learningNote: 'kubectl get nodes exposes Kubernetes Node status; the game health meter is only a gameplay/SLA abstraction.',
      },
      {
        id: 'req-002', customerName: 'Mike Chen', customerRole: 'Frontend Lead', characterType: 'normal',
        title: 'Deploy First NGINX Workload', description: 'Create web-01 with nginx and wait for Kubernetes to make it Ready.',
        requirements: { type: 'create-pod', podName: 'web-01', image: 'nginx' }, lane: 1, slaTimeSeconds: 65, rewardPoints: 150,
        hints: ['Create a simple Pod.', 'Use kubectl run.', 'Name it web-01 and use nginx.', 'Execute: kubectl run web-01 --image=nginx'],
        learningNote: 'The API creates desired state first; the scheduler binds the Pending Pod, then kubelet/runtime startup leads to Running and Ready.',
      },
      {
        id: 'req-003', customerName: 'Elena Rostova', customerRole: 'SRE Specialist', characterType: 'normal',
        title: 'Discover Pod Placement', description: 'Find which Node the scheduler actually selected for web-01.',
        requirements: { type: 'inspect-pods-wide' }, lane: 1, slaTimeSeconds: 70, rewardPoints: 120,
        hints: ['Inspect Pods with extended columns.', 'Use output format wide.', 'The NODE column reveals placement.', 'Execute: kubectl get pods -o wide'],
        learningNote: 'The customer lane does not select the Node. kube-scheduler chooses from eligible Nodes according to scheduling constraints and scoring.',
      },
      {
        id: 'req-004', customerName: 'Devon Vance', customerRole: 'Data Engineer', characterType: 'urgent',
        title: 'Deploy Redis Cache Pod', description: 'Create cache-01 using redis and wait for the Pod to become Ready.',
        requirements: { type: 'create-pod', podName: 'cache-01', image: 'redis' }, lane: 0, slaTimeSeconds: 50, rewardPoints: 180,
        hints: ['Create another simple Pod.', 'Use kubectl run cache-01.', 'Specify --image=redis.', 'Execute: kubectl run cache-01 --image=redis'],
        learningNote: 'kubelet coordinates the container runtime and Pod setup on the Node selected by the scheduler.',
      },
      {
        id: 'req-005', customerName: 'Priya Patel', customerRole: 'API Developer', characterType: 'normal',
        title: 'Deploy Backend API Pod', description: 'Create api-01 using nginx and observe that multiple workloads can share Nodes.',
        requirements: { type: 'create-pod', podName: 'api-01', image: 'nginx' }, lane: 2, slaTimeSeconds: 55, rewardPoints: 150,
        hints: ['Create api-01.', 'Use kubectl run.', 'Specify nginx.', 'Execute: kubectl run api-01 --image=nginx'],
        learningNote: 'Multiple Pods can share a Node as long as scheduling requirements fit the Node allocatable resources and other constraints.',
      },
      {
        id: 'req-006', customerName: 'Marcus Wright', customerRole: 'Platform Engineer', characterType: 'normal',
        title: 'Inspect Worker-2 Resources', description: 'Inspect worker-2 and compare Capacity, Allocatable and total Pod resource requests.',
        requirements: { type: 'describe-node', nodeName: 'worker-2' }, lane: 1, slaTimeSeconds: 65, rewardPoints: 140,
        hints: ['Use describe for detailed Node information.', 'Target node worker-2.', 'Syntax: kubectl describe node <name>.', 'Execute: kubectl describe node worker-2'],
        learningNote: 'Capacity is the Node total; Allocatable is what Kubernetes makes available to Pods after system reservations. Scheduling uses Pod requests against allocatable resources.',
      },
      {
        id: 'req-007', customerName: 'Klaus Mueller', customerRole: 'ML Infrastructure', characterType: 'cpu-burner',
        title: 'Deploy Compute Workload (500m CPU)', description: 'Create compute-01 with a 500m CPU request using real kubectl --overrides syntax.',
        requirements: { type: 'create-pod', podName: 'compute-01', image: 'nginx', minCpu: 0.5 }, lane: 0, slaTimeSeconds: 80, rewardPoints: 220,
        hints: [
          'kubectl run does not have a current --requests flag.',
          'Use --overrides to supply Pod container resources.requests.',
          'Set requests.cpu to 500m for compute-01.',
          `Execute: kubectl run compute-01 --image=nginx --overrides='${cpuOverrides}'`,
        ],
        learningNote: 'CPU requests are scheduling inputs. They reserve scheduler accounting against Node Allocatable; they are not a measurement of live CPU usage.',
      },
      {
        id: 'req-008', customerName: 'Ananya Roy', customerRole: 'Database Administrator', characterType: 'memory-hog',
        title: 'Deploy Memory Workload (1024Mi)', description: 'Create db-01 with a 1024Mi memory request using a real Pod override.',
        requirements: { type: 'create-pod', podName: 'db-01', image: 'redis', minMem: 1024 }, lane: 2, slaTimeSeconds: 80, rewardPoints: 250,
        hints: [
          'Memory requests influence scheduling; they do not guarantee exclusive physical RAM.',
          'Use --overrides with resources.requests.memory.',
          'Set memory to 1024Mi.',
          `Execute: kubectl run db-01 --image=redis --overrides='${memoryOverrides}'`,
        ],
        learningNote: 'The scheduler uses memory requests when checking whether a Pod fits on a Node. Limits and actual usage are separate concepts.',
      },
      {
        id: 'req-009', customerName: 'VP of Engineering', customerRole: 'Incident Commander', characterType: 'escalation',
        title: 'MINI-BOSS: Gateway Workload', description: 'Create gateway-01 with 1000m CPU and 2048Mi memory requests. Let the scheduler choose the eligible Node.',
        requirements: { type: 'create-pod', podName: 'gateway-01', image: 'nginx', minCpu: 1, minMem: 2048 }, lane: 1, slaTimeSeconds: 90, rewardPoints: 400,
        hints: [
          'The workload needs both CPU and memory requests.',
          'Use --overrides with both requests.cpu and requests.memory.',
          'Do not assume the customer lane selects a Node.',
          `Execute: kubectl run gateway-01 --image=nginx --overrides='${gatewayOverrides}'`,
        ],
        learningNote: 'The training scheduler filters Nodes that cannot fit the request, scores the remaining Nodes, and selects one. The exact Node is determined by current cluster state, not scripted by lane.',
      },
    ],
    learningOutcomes: [
      'A Pod object can exist in Pending before it is scheduled or Ready.',
      'The scheduler filters and scores eligible Nodes; customer lanes are not scheduler constraints.',
      'Node Allocatable, not raw Capacity, is the scheduling budget for Pod resource requests.',
      'Requests, limits and live resource usage are distinct concepts.',
      'kubectl get pods -o wide reveals actual Node placement.',
      'kubectl describe exposes cluster state and scheduling events rather than scripted outcomes.',
    ],
  },
];

export const allChapters: ChapterConfig[] = [
  {
    id: 1,
    title: 'Chapter 1: Nodes & Scheduling',
    description: 'Nodes, Pending Pods, resource requests, Allocatable capacity and scheduler placement.',
    badge: 'NODES', unlocked: true, levels: chapter01Levels,
  },
  {
    id: 2,
    title: 'Chapter 2: Pods & Lifecycle',
    description: 'Pod phase and container state/reasons: Pending, Running, readiness, image-pull failures and CrashLoopBackOff without treating backoff reasons as Pod phases.',
    badge: 'PODS', unlocked: false, levels: [],
  },
  {
    id: 3,
    title: 'Chapter 3: Deployments & ReplicaSets',
    description: 'Controllers reconcile desired replicas: Deployments own ReplicaSets, ReplicaSets replace managed Pods, and bare Pods do not self-heal.',
    badge: 'DEPLOY', unlocked: false, levels: [],
  },
  {
    id: 4,
    title: 'Chapter 4: Services & Networking',
    description: 'Services select Pods through labels, ClusterIP/NodePort/LoadBalancer expose traffic differently, and Ingress requires a controller.',
    badge: 'NETWORKING', unlocked: false, levels: [],
  },
  {
    id: 5,
    title: 'Chapter 5: Troubleshooting & Boss Battles',
    description: 'Troubleshoot Pending/NotReady/OOM/throttling and control-plane incidents while distinguishing requests, limits, usage and etcd quorum.',
    badge: 'INCIDENTS', unlocked: false, levels: [],
  },
];
