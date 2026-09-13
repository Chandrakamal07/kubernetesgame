import type { ChapterConfig, LevelConfig, LessonMission } from './types';
import type { K8sNode } from '../simulator/types';

export function createDefaultNodes(): K8sNode[] {
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

export const chapter01Missions: LessonMission[] = [
  // Lesson 0: Meet the Cluster
  {
    id: 'lesson-0',
    lessonNumber: 0,
    title: 'Lesson 0: Meet the Cluster',
    subtitle: 'Cluster Architecture & Component Discovery',
    lane: 0,
    teach: {
      summary: 'A Kubernetes cluster is a group of connected machines. The Control Plane makes decisions, while Worker Nodes run your application workloads inside Pods.',
      concepts: [
        {
          term: 'Cluster',
          plainMeaning: 'A team of computers working together as one system.',
          technicalMeaning: 'A set of worker machines (nodes) that run containerized applications managed by a control plane.',
          analogy: 'An airport with a control tower and multiple runways.',
        },
        {
          term: 'Control Plane',
          plainMeaning: 'The brains of the cluster that coordinates all work.',
          technicalMeaning: 'The collection of processes (kube-apiserver, etcd, kube-scheduler, kube-controller-manager) that maintain cluster state.',
          analogy: 'The flight control tower directing incoming and outgoing planes.',
        },
        {
          term: 'Worker Node',
          plainMeaning: 'A machine with CPU and RAM that runs your programs.',
          technicalMeaning: 'A physical or virtual machine running kubelet, kube-proxy, and a container runtime.',
          analogy: 'A runway/hangar where aircraft are fueled and serviced.',
        },
        {
          term: 'Pod',
          plainMeaning: 'The smallest box Kubernetes creates to run your application.',
          technicalMeaning: 'The smallest deployable unit of computing that can be created and managed in Kubernetes.',
          analogy: 'A shipping container holding cargo.',
        },
      ],
      whyThisMatters: 'Understanding who makes decisions (Control Plane) vs who does the physical compute (Worker Nodes) is the foundation of everything in Kubernetes.',
    },
    goal: {
      plainLanguage: 'Inspect the cluster components on your screen to understand where the control plane, worker nodes, and terminal are located.',
      requiredInputs: [
        { label: 'Activity', value: 'Component Discovery', explanation: 'Explore the cluster layout before typing your first command.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl get nodes',
      segments: [
        { token: 'kubectl', meaning: 'Talk to the Kubernetes API server', category: 'tool' },
        { token: 'get', meaning: 'Query/list existing resources', category: 'verb' },
        { token: 'nodes', meaning: 'Worker machines in the cluster', category: 'resource' },
      ],
    },
    verification: {
      command: 'kubectl get nodes',
      expectedObservation: 'All 3 worker nodes are listed with status "Ready".',
    },
    completionRule: {
      type: 'inspect-cluster-components',
      kind: 'INTERACTION',
    },
    gameEffect: 'SCAN',
    review: {
      whatHappened: [
        'You explored the control-plane hub, worker nodes, and terminal.',
        'You learned that the control plane manages workloads and worker nodes run them.',
      ],
      keyTakeaway: 'In Kubernetes, you give instructions to the Control Plane, and it coordinates the Worker Nodes for you.',
    },
    hints: [
      'Click on any component or click "Start Lesson 1" to proceed.',
      'Explore the three worker nodes (worker-1, worker-2, worker-3) on the left of the battlefield.',
      'Notice the Control Plane hub in the upper corner connecting to all workers.',
      'Click "Continue" when you are ready for your first terminal command.',
    ],
    timeToImpactSeconds: 90,
    basePoints: 100,
  },

  // Lesson 1: Ask Kubernetes What Exists
  {
    id: 'lesson-1',
    lessonNumber: 1,
    title: 'Lesson 1: Ask Kubernetes What Exists',
    subtitle: 'Inspecting Worker Nodes via kubectl get nodes',
    lane: 0,
    teach: {
      summary: 'Before deploying applications, administrators ask Kubernetes what machines are available. The command "kubectl get nodes" queries the API server and lists all worker nodes.',
      concepts: [
        {
          term: 'kubectl',
          plainMeaning: 'The official command-line tool used to talk to Kubernetes.',
          technicalMeaning: 'The Kubernetes CLI client that communicates with the kube-apiserver using REST requests.',
          analogy: 'A phone you use to call the front desk.',
        },
        {
          term: 'get',
          plainMeaning: 'An instruction telling Kubernetes: "Show me a list of things."',
          technicalMeaning: 'A read-only API query that retrieves resource object lists from the API server.',
        },
        {
          term: 'Ready Status',
          plainMeaning: 'The node is healthy and able to accept new workloads.',
          technicalMeaning: 'The kubelet on that node has posted a healthy NodeReady condition heartbeat.',
        },
      ],
      whyThisMatters: 'You always inspect the cluster first to verify your worker nodes are online and ready to accept Pods.',
    },
    goal: {
      plainLanguage: 'List all worker nodes in the cluster and verify that their status is "Ready".',
      requiredInputs: [
        { label: 'Command', value: 'kubectl get nodes', explanation: 'Queries the API server for all node objects.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl get nodes',
      segments: [
        { token: 'kubectl', meaning: 'The Kubernetes CLI tool', category: 'tool' },
        { token: 'get', meaning: 'List resources', category: 'verb' },
        { token: 'nodes', meaning: 'The worker machines', category: 'resource' },
      ],
    },
    verification: {
      command: 'kubectl get nodes',
      expectedObservation: 'Outputs columns: NAME, STATUS, ROLES, AGE, VERSION with worker-1, worker-2, worker-3.',
    },
    completionRule: {
      type: 'inspect-nodes',
      kind: 'COMMAND',
    },
    gameEffect: 'SCAN',
    review: {
      whatHappened: [
        'kubectl sent a GET request to the kube-apiserver.',
        'The API server returned the list of 3 registered worker nodes.',
        'All 3 nodes are in the Ready state with active kubelet daemons.',
      ],
      keyTakeaway: '"kubectl get" is your primary tool for observing what currently exists in a cluster.',
    },
    hints: [
      'Type "kubectl get nodes" into the terminal and press Enter.',
      'The "get" verb lists resources of a specific kind.',
      'The resource type is "nodes" (or "node").',
      'Execute: kubectl get nodes',
    ],
    timeToImpactSeconds: 80,
    basePoints: 100,
  },

  // Lesson 2: Pods and Container Images
  {
    id: 'lesson-2',
    lessonNumber: 2,
    title: 'Lesson 2: Pods and Container Images',
    subtitle: 'Understanding Workloads and Packaged Applications',
    lane: 1,
    teach: {
      summary: 'Kubernetes does not run source code directly. It runs container images inside Pods. A container image is a packaged bundle of an application and everything it needs to run.',
      concepts: [
        {
          term: 'Container Image',
          plainMeaning: 'A pre-packaged software bundle containing your app and its dependencies.',
          technicalMeaning: 'A static, immutable binary package containing application files, libraries, and runtime configuration.',
          analogy: 'A freeze-dried meal kit ready to be heated up.',
        },
        {
          term: 'nginx image',
          plainMeaning: 'A popular, lightweight web server used to serve websites.',
          technicalMeaning: 'The official container image for the NGINX web server, commonly used for HTTP traffic.',
        },
        {
          term: 'Pod Specification',
          plainMeaning: 'The blueprint telling Kubernetes which container image to put inside the Pod.',
          technicalMeaning: 'The PodSpec defining containers, images, ports, and resource requests.',
        },
      ],
      whyThisMatters: 'Kubernetes cannot guess what program you want to run. You must always tell it which container image to download and execute.',
    },
    goal: {
      plainLanguage: 'Review the container image concept card for "nginx" so you know what application we will launch in Lesson 3.',
      requiredInputs: [
        { label: 'Container Image', value: 'nginx', explanation: 'A lightweight web-server image used for your first workload.' },
        { label: 'Target Pod Name', value: 'web-01', explanation: 'The unique name we will give to our first Pod.' },
      ],
    },
    verification: {
      expectedObservation: 'Image concept confirmed: nginx provides a web server that listens for incoming traffic.',
    },
    completionRule: {
      type: 'concept-review',
      kind: 'INTERACTION',
    },
    gameEffect: 'VERIFY',
    review: {
      whatHappened: [
        'You learned that Pods host container images.',
        'You identified "nginx" as the container image for our web server.',
      ],
      keyTakeaway: 'Every Pod requires a container image (like "nginx") so Kubernetes knows what software to start.',
    },
    hints: [
      'Read the concept card explaining the "nginx" container image.',
      'A Pod wraps one or more containers running an image.',
      'Click "Acknowledge & Continue" to proceed to creating the Pod.',
      'Click the button to start Lesson 3.',
    ],
    timeToImpactSeconds: 60,
    basePoints: 100,
  },

  // Lesson 3: Create the First Pod
  {
    id: 'lesson-3',
    lessonNumber: 3,
    title: 'Lesson 3: Create Your First Pod',
    subtitle: 'Deploying web-01 with the nginx image',
    lane: 1,
    teach: {
      summary: 'The command "kubectl run <name> --image=<image>" tells the API server to create a new Pod. Kubernetes stores it in etcd, the scheduler assigns it to a worker node, and the node pulls the image and starts the container.',
      concepts: [
        {
          term: 'kubectl run',
          plainMeaning: 'Creates and starts a single Pod in the cluster.',
          technicalMeaning: 'Generates a Pod API object directly in the API server with the specified container image.',
        },
        {
          term: 'Pod Lifecycle',
          plainMeaning: 'The journey of a Pod from being requested to actively running.',
          technicalMeaning: 'Pending -> Scheduled -> ContainerCreating -> Running -> Ready.',
        },
        {
          term: 'Ready State',
          plainMeaning: 'The container has booted and is ready to handle real work.',
          technicalMeaning: 'All readiness probes pass, setting Conditions[Ready]=True.',
        },
      ],
      whyThisMatters: 'Creating a Pod is the fundamental action in Kubernetes. Understanding its lifecycle helps you know when it is actually ready to handle traffic.',
    },
    goal: {
      plainLanguage: 'Create a Pod named "web-01" running the "nginx" web-server image using "kubectl run".',
      requiredInputs: [
        { label: 'Pod Name', value: 'web-01', explanation: 'The unique identifier for this Pod in the cluster.' },
        { label: 'Container Image', value: 'nginx', explanation: 'The packaged web-server application taught in Lesson 2.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl run web-01 --image=nginx',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'run', meaning: 'Create and start a Pod', category: 'verb' },
        { token: 'web-01', meaning: 'Name of the new Pod', category: 'name' },
        { token: '--image', meaning: 'Select the container image', category: 'flag' },
        { token: 'nginx', meaning: 'Web-server image name', category: 'value' },
      ],
    },
    verification: {
      command: 'kubectl get pods',
      expectedObservation: 'Pod "web-01" transitions to Running with 1/1 containers Ready.',
    },
    completionRule: {
      type: 'create-pod',
      kind: 'STATE',
      podName: 'web-01',
      image: 'nginx',
      requireReady: true,
    },
    gameEffect: 'DEPLOY',
    review: {
      whatHappened: [
        '1. API server validated and persisted pod/web-01 to etcd.',
        '2. kube-scheduler evaluated candidate nodes and bound web-01 to a worker.',
        '3. kubelet on that worker pulled the nginx image and started the container.',
        '4. The Pod reached Running and Ready: True.',
      ],
      keyTakeaway: 'A command finishes in a millisecond, but the Pod only serves traffic after the worker node finishes starting the container.',
    },
    hints: [
      'Use "kubectl run" followed by the Pod name and --image flag.',
      'Pod name is "web-01" and image is "nginx".',
      'Format: kubectl run web-01 --image=nginx',
      'Execute: kubectl run web-01 --image=nginx',
    ],
    timeToImpactSeconds: 90,
    basePoints: 150,
  },

  // Lesson 4: Watch the Pod Lifecycle
  {
    id: 'lesson-4',
    lessonNumber: 4,
    title: 'Lesson 4: Watch the Pod Lifecycle',
    subtitle: 'Distinguishing Pod Phase from Container State',
    lane: 1,
    teach: {
      summary: 'When you run "kubectl get pods", the STATUS column often displays reasons like "ContainerCreating" or "Running". In Kubernetes, "Pod Phase" (Pending/Running) is separate from container-level waiting reasons.',
      concepts: [
        {
          term: 'Pod Phase',
          plainMeaning: 'The high-level phase of the Pod (Pending, Running, Succeeded, Failed).',
          technicalMeaning: 'A high-level summary of where the Pod is in its lifecycle (pod.status.phase).',
        },
        {
          term: 'ContainerCreating',
          plainMeaning: 'The worker node is currently downloading the image and setting up networking.',
          technicalMeaning: 'A waiting reason shown by kubectl while the container runtime creates the sandbox and pulls image layers.',
        },
        {
          term: 'READY Column (1/1)',
          plainMeaning: 'How many containers inside the Pod are healthy and ready to serve.',
          technicalMeaning: 'Ready containers count vs total containers count in the Pod spec.',
        },
      ],
      whyThisMatters: 'Knowing what "ContainerCreating" means prevents panic when a Pod does not start instantly.',
    },
    goal: {
      plainLanguage: 'List the active pods using "kubectl get pods" to observe the READY column and STATUS.',
      requiredInputs: [
        { label: 'Command', value: 'kubectl get pods', explanation: 'Lists all pods in the current namespace.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl get pods',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'get', meaning: 'List resources', category: 'verb' },
        { token: 'pods', meaning: 'Workload instances', category: 'resource' },
      ],
    },
    verification: {
      command: 'kubectl get pods',
      expectedObservation: 'Displays web-01 with READY 1/1 and STATUS Running.',
    },
    completionRule: {
      type: 'inspect-pods',
      kind: 'COMMAND',
    },
    gameEffect: 'VERIFY',
    review: {
      whatHappened: [
        'You listed the pods and verified web-01 is Running with 1/1 containers Ready.',
        'You learned that ContainerCreating is a temporary waiting state while images download.',
      ],
      keyTakeaway: '"kubectl get pods" lets you check the health and readiness of all running workloads.',
    },
    hints: [
      'Type "kubectl get pods" to list workloads.',
      'Observe the READY and STATUS columns.',
      'Execute: kubectl get pods',
      'Run: kubectl get pods',
    ],
    timeToImpactSeconds: 70,
    basePoints: 100,
  },

  // Lesson 5: Find Where the Pod Runs
  {
    id: 'lesson-5',
    lessonNumber: 5,
    title: 'Lesson 5: Find Where the Pod Runs',
    subtitle: 'Using the -o wide Output Flag',
    lane: 1,
    teach: {
      summary: 'By default, "kubectl get pods" hides details to keep the table compact. Adding "-o wide" reveals extra columns including the assigned worker NODE and the Pod IP address.',
      concepts: [
        {
          term: '-o flag',
          plainMeaning: 'Stands for "output format". It changes how Kubernetes formats the results.',
          technicalMeaning: 'The kubectl output formatting flag supporting wide, json, yaml, and name.',
        },
        {
          term: '-o wide',
          plainMeaning: 'Shows a wider table with extra columns like NODE and IP.',
          technicalMeaning: 'Renders additional Pod status fields including podIP, hostIP, and nodeName.',
        },
        {
          term: 'NODE Column',
          plainMeaning: 'The specific worker machine chosen by the scheduler for this Pod.',
          technicalMeaning: 'The nodeName field where the Pod is bound and running.',
        },
      ],
      whyThisMatters: 'In a cluster with dozens of machines, "-o wide" is the fastest way to see which physical machine is hosting a workload.',
    },
    goal: {
      plainLanguage: 'Discover which worker node was chosen by the scheduler for web-01 by running "kubectl get pods -o wide".',
      requiredInputs: [
        { label: 'Output Flag', value: '-o wide', explanation: 'Adds extended columns (NODE, IP) to the pod list.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl get pods -o wide',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'get', meaning: 'List resources', category: 'verb' },
        { token: 'pods', meaning: 'Workload instances', category: 'resource' },
        { token: '-o', meaning: 'Output format flag', category: 'flag' },
        { token: 'wide', meaning: 'Include NODE and IP columns', category: 'value' },
      ],
    },
    verification: {
      command: 'kubectl get pods -o wide',
      expectedObservation: 'Displays web-01 with NODE (e.g. worker-1 or worker-2) and an internal IP.',
    },
    completionRule: {
      type: 'inspect-pods-wide',
      kind: 'OBSERVATION',
    },
    gameEffect: 'SCAN',
    review: {
      whatHappened: [
        'The "-o wide" flag revealed the NODE and IP columns.',
        'You saw exactly which worker node the scheduler selected for web-01.',
      ],
      keyTakeaway: 'Use "-o wide" whenever you need to check workload placement or IP addresses.',
    },
    hints: [
      'Add "-o wide" to the "kubectl get pods" command.',
      'Syntax: kubectl get pods -o wide',
      'The "-o" flag specifies output formatting.',
      'Execute: kubectl get pods -o wide',
    ],
    timeToImpactSeconds: 70,
    basePoints: 120,
  },

  // Lesson 6: Capacity, Allocatable and Requests
  {
    id: 'lesson-6',
    lessonNumber: 6,
    title: 'Lesson 6: Capacity, Allocatable and Requests',
    subtitle: 'Declarative Workload Deployment (compute-01.yaml)',
    lane: 2,
    teach: {
      summary: 'Worker nodes have Capacity (total physical hardware) and Allocatable (what is left for Pods after system services). In production, you define resource requests in YAML manifests so the scheduler knows how much CPU and RAM a Pod needs.',
      concepts: [
        {
          term: 'Allocatable Resources',
          plainMeaning: 'The portion of a node\'s CPU and RAM available for your workloads.',
          technicalMeaning: 'Node Capacity minus kube-reserved and system-reserved hardware amounts.',
        },
        {
          term: 'CPU Millicores (500m)',
          plainMeaning: 'One thousandth of a CPU core. 500m is half a CPU core (0.5 CPU).',
          technicalMeaning: 'A Kubernetes CPU resource unit where 1000m equals 1 vCPU core.',
        },
        {
          term: 'kubectl apply -f',
          plainMeaning: 'Creates or updates resources using a declarative YAML file.',
          technicalMeaning: 'Applies a declarative configuration file to the cluster via server-side or client-side apply.',
        },
      ],
      whyThisMatters: 'If you do not specify resource requests, the scheduler cannot balance workloads intelligently. Declarative YAML files make your deployments reproducible.',
    },
    goal: {
      plainLanguage: 'Apply the declarative manifest "compute-01.yaml" which requests 500m CPU (0.5 cores) using "kubectl apply -f".',
      requiredInputs: [
        { label: 'Manifest File', value: 'compute-01.yaml', explanation: 'A declarative YAML file defining a Pod with 500m CPU request.' },
        { label: 'Pod Name', value: 'compute-01', explanation: 'The workload defined inside compute-01.yaml.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl apply -f compute-01.yaml',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'apply', meaning: 'Apply declarative configuration', category: 'verb' },
        { token: '-f', meaning: 'Filename flag', category: 'flag' },
        { token: 'compute-01.yaml', meaning: 'The manifest file to deploy', category: 'value' },
      ],
    },
    verification: {
      command: 'kubectl get pods -o wide',
      expectedObservation: 'Pod "compute-01" is Running and Ready on a worker with sufficient allocatable CPU.',
    },
    completionRule: {
      type: 'create-pod',
      kind: 'STATE',
      podName: 'compute-01',
      image: 'nginx',
      minCpu: 0.5,
      requireReady: true,
      manifestFile: 'compute-01.yaml',
    },
    gameEffect: 'DEPLOY',
    review: {
      whatHappened: [
        '1. You applied compute-01.yaml using "kubectl apply -f".',
        '2. The scheduler checked remaining allocatable CPU on all nodes.',
        '3. The node with the best fit was selected and 500m CPU was allocated.',
      ],
      keyTakeaway: 'Resource requests ensure Kubernetes places workloads only on worker nodes with enough available compute.',
    },
    hints: [
      'You can inspect the file with "cat compute-01.yaml" first if you wish.',
      'Use "kubectl apply -f <filename>" to apply the manifest.',
      'Filename is compute-01.yaml.',
      'Execute: kubectl apply -f compute-01.yaml',
    ],
    timeToImpactSeconds: 65,
    basePoints: 200,
  },

  // Lesson 7: Why a Pod Can Stay Pending
  {
    id: 'lesson-7',
    lessonNumber: 7,
    title: 'Lesson 7: Why a Pod Can Stay Pending',
    subtitle: 'Diagnosing Scheduling Failures (big-cache.yaml)',
    lane: 1,
    teach: {
      summary: 'If a Pod requests more CPU or Memory than any worker node has available, the API server still accepts the object, but the scheduler cannot place it. The Pod stays in "Pending" status with a "FailedScheduling" warning event.',
      concepts: [
        {
          term: 'Pending Phase',
          plainMeaning: 'The Pod object exists in the cluster, but no worker node has been found to run it.',
          technicalMeaning: 'The Pod has been accepted by the API server, but one or more containers have not been scheduled or created.',
        },
        {
          term: 'FailedScheduling Event',
          plainMeaning: 'A diagnostic warning from kube-scheduler explaining why no node could fit the Pod.',
          technicalMeaning: 'A Kubernetes Warning event recording predicate filter failures (e.g. Insufficient memory).',
        },
        {
          term: 'kubectl describe pod',
          plainMeaning: 'Shows detailed diagnostic information and events for a specific Pod.',
          technicalMeaning: 'Fetches the full object state, conditions, and associated Events from the cluster.',
        },
      ],
      whyThisMatters: 'A Pending Pod is not a bug—it is the scheduler protecting your cluster from running out of memory. Knowing how to diagnose it with "kubectl describe" is a vital skill.',
    },
    goal: {
      plainLanguage: 'Apply the oversized "big-cache.yaml" manifest (requesting 16Gi RAM) and diagnose why it stays in Pending using "kubectl describe pod big-cache".',
      requiredInputs: [
        { label: 'Manifest File', value: 'big-cache.yaml', explanation: 'A manifest requesting 16Gi RAM (more than any node has allocatable).' },
        { label: 'Target Pod Name', value: 'big-cache', explanation: 'The name of the oversized pending Pod.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl apply -f big-cache.yaml',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'apply', meaning: 'Apply declarative configuration', category: 'verb' },
        { token: '-f', meaning: 'Filename flag', category: 'flag' },
        { token: 'big-cache.yaml', meaning: 'Oversized manifest file', category: 'value' },
      ],
    },
    verification: {
      command: 'kubectl describe pod big-cache',
      expectedObservation: 'Events section shows: Warning FailedScheduling (0/3 nodes available: 3 Insufficient memory).',
    },
    completionRule: {
      type: 'failed-scheduling',
      kind: 'STATE',
      podName: 'big-cache',
    },
    gameEffect: 'DIAGNOSE',
    review: {
      whatHappened: [
        '1. big-cache requested 16Gi RAM.',
        '2. The scheduler filtered all nodes: worker-1 (3.5Gi free), worker-2 (7.5Gi free), worker-3 (1.75Gi free).',
        '3. No node met the requirement, so the Pod remained Pending.',
        '4. "kubectl describe pod big-cache" revealed the exact root cause in the Events section.',
      ],
      keyTakeaway: '"kubectl describe pod" is your primary diagnostic command to discover why a Pod is not running.',
    },
    hints: [
      'First apply the file: kubectl apply -f big-cache.yaml',
      'Notice the Pod stays in Pending status.',
      'Inspect the failure reason with: kubectl describe pod big-cache',
      'Execute: kubectl apply -f big-cache.yaml',
    ],
    timeToImpactSeconds: 65,
    basePoints: 220,
  },

  // Lesson 8: Clean Up Safely
  {
    id: 'lesson-8',
    lessonNumber: 8,
    title: 'Lesson 8: Clean Up Safely',
    subtitle: 'Deleting Objects via kubectl delete pod',
    lane: 1,
    teach: {
      summary: 'When you delete a standalone ("bare") Pod using "kubectl delete pod <name>", Kubernetes removes the object from etcd and reclaims its resources. Because it has no parent controller, it will not recreate itself.',
      concepts: [
        {
          term: 'kubectl delete',
          plainMeaning: 'Removes an object from the cluster.',
          technicalMeaning: 'Sends a DELETE request to the API server, triggering graceful termination and etcd removal.',
        },
        {
          term: 'Bare Pod',
          plainMeaning: 'A Pod created on its own without a manager like a Deployment.',
          technicalMeaning: 'A Pod without an ownerReference controller. When deleted, it is permanently removed.',
        },
        {
          term: 'Resource Reclamation',
          plainMeaning: 'Freeing up CPU and RAM so other workloads can use them.',
          technicalMeaning: 'Updating node.requested counters and triggering the scheduler retry queue for pending pods.',
        },
      ],
      whyThisMatters: 'Cleaning up unschedulable or unused workloads keeps your cluster clean and makes room for new applications.',
    },
    goal: {
      plainLanguage: 'Delete the unschedulable "big-cache" pod using "kubectl delete pod big-cache" to clean up the cluster.',
      requiredInputs: [
        { label: 'Command', value: 'kubectl delete pod big-cache', explanation: 'Permanently removes the pending big-cache Pod.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl delete pod big-cache',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'delete', meaning: 'Remove an object', category: 'verb' },
        { token: 'pod', meaning: 'Resource type', category: 'resource' },
        { token: 'big-cache', meaning: 'Name of the Pod to delete', category: 'name' },
      ],
    },
    verification: {
      command: 'kubectl get pods',
      expectedObservation: 'big-cache is no longer listed.',
    },
    completionRule: {
      type: 'delete-pod',
      kind: 'STATE',
      podName: 'big-cache',
    },
    gameEffect: 'CLEANUP',
    review: {
      whatHappened: [
        '1. The API server received the deletion request for pod/big-cache.',
        '2. The object was removed from the cluster state.',
        '3. Cluster resources remained available for valid workloads.',
      ],
      keyTakeaway: 'Deleting a bare Pod removes it completely. In future chapters, you will learn how Deployments self-heal!',
    },
    hints: [
      'Use the "kubectl delete" command.',
      'Specify the resource type "pod" and name "big-cache".',
      'Format: kubectl delete pod big-cache',
      'Execute: kubectl delete pod big-cache',
    ],
    timeToImpactSeconds: 60,
    basePoints: 150,
  },

  // Chapter 1 Challenge: Final Integrated Cluster Defense
  {
    id: 'lesson-challenge',
    lessonNumber: 9,
    title: 'Chapter 1 Challenge: Cluster Defense',
    subtitle: 'Independent Multi-Step Cluster Management',
    lane: 0,
    teach: {
      summary: 'Put everything together! Deploy a database cache using db-01.yaml (1024Mi RAM request), verify placement, and keep the cluster running cleanly.',
      concepts: [
        {
          term: 'Integrated Workflow',
          plainMeaning: 'Applying manifests, observing placement with -o wide, and validating health independently.',
          technicalMeaning: 'Full lifecycle cluster management: Apply -> Schedule -> Running -> Ready.',
        },
      ],
      whyThisMatters: 'Testing your skills without hints proves you have mastered Kubernetes cluster basics!',
    },
    goal: {
      plainLanguage: 'Deploy the database cache using "kubectl apply -f db-01.yaml" (1024Mi RAM request) and verify it reaches Running & Ready.',
      requiredInputs: [
        { label: 'Manifest File', value: 'db-01.yaml', explanation: 'Redis cache manifest requesting 1024Mi memory.' },
        { label: 'Pod Name', value: 'db-01', explanation: 'The Redis database cache Pod.' },
        { label: 'Container Image', value: 'redis', explanation: 'In-memory database cache image inside db-01.yaml.' },
      ],
    },
    guidedCommand: {
      fullCommand: 'kubectl apply -f db-01.yaml',
      segments: [
        { token: 'kubectl', meaning: 'The CLI tool', category: 'tool' },
        { token: 'apply', meaning: 'Apply declarative configuration', category: 'verb' },
        { token: '-f', meaning: 'Filename flag', category: 'flag' },
        { token: 'db-01.yaml', meaning: 'Database cache manifest', category: 'value' },
      ],
    },
    verification: {
      command: 'kubectl get pods -o wide',
      expectedObservation: 'Pod "db-01" is Running and Ready on a worker with at least 1024Mi allocatable memory.',
    },
    completionRule: {
      type: 'create-pod',
      kind: 'STATE',
      podName: 'db-01',
      image: 'redis',
      minMem: 1024,
      requireReady: true,
      manifestFile: 'db-01.yaml',
    },
    gameEffect: 'DEPLOY',
    review: {
      whatHappened: [
        'You deployed db-01.yaml requesting 1024Mi RAM.',
        'The scheduler placed it on an eligible node based on remaining allocatable memory.',
        'You have successfully completed Chapter 1: Nodes & Scheduling!',
      ],
      keyTakeaway: 'You now know how to inspect nodes, deploy pods, check lifecycles, and diagnose scheduling!',
    },
    hints: [
      'Apply the database manifest: kubectl apply -f db-01.yaml',
      'The file requests 1024Mi RAM.',
      'Check its placement with: kubectl get pods -o wide',
      'Execute: kubectl apply -f db-01.yaml',
    ],
    timeToImpactSeconds: 60,
    basePoints: 300,
  },
];

export const tutorialLevel: LevelConfig = {
  id: 0,
  chapterId: 1,
  title: 'Tutorial: Cluster Boot & Basics',
  subtitle: 'Guided Introduction to Kubernetes Defense',
  description: 'Learn the core Kubernetes defense mechanics: inspect worker nodes, deploy pods via kubectl, observe the lifecycle, and power up worker node defenses.',
  initialNodes: createDefaultNodes(),
  missions: [chapter01Missions[0], chapter01Missions[1], chapter01Missions[3]],
  requests: [chapter01Missions[0], chapter01Missions[1], chapter01Missions[3]],
  learningOutcomes: [
    'Worker nodes provide compute capacity (Allocatable CPU/RAM) to run container workloads.',
    'Kubernetes objects are managed through the terminal using "kubectl".',
    'The Kube-Scheduler automatically assigns pending pods to nodes based on resource availability.',
    'A successful command creates the API object, but the workload serves traffic only when Running & Ready.',
  ],
};

export const chapter01Levels: LevelConfig[] = [
  {
    id: 1,
    chapterId: 1,
    title: 'Chapter 1: Nodes & Scheduling',
    subtitle: 'Cluster Architecture, Allocatable Capacity & Lifecycle',
    description: 'Learn how Kubernetes worker nodes run container workloads, how kube-scheduler assigns Pods, and how resource requests affect scheduling.',
    initialNodes: createDefaultNodes(),
    missions: chapter01Missions,
    requests: chapter01Missions,
    learningOutcomes: [
      'Worker nodes provide compute capacity (Allocatable CPU/RAM) for container workloads.',
      'Pods are the fundamental unit of deployment in Kubernetes.',
      'The Kube-Scheduler filters nodes based on Allocatable capacity, taints, and status, then scores eligible nodes.',
      'A successful CLI command creates the API object in etcd, but workloads only serve traffic when Running and Ready.',
      'kubectl describe node and kubectl describe pod provide vital observability into resource allocations and lifecycle events.',
      'When resource requests exceed node allocatable capacity, the Pod remains Pending with a FailedScheduling event.',
    ],
  },
];

export const allChapters: ChapterConfig[] = [
  {
    id: 1,
    title: 'Chapter 1: Nodes & Scheduling',
    description: 'Learn cluster anatomy, allocatable capacity, pod placement, and kube-scheduler scoring.',
    badge: 'NODES',
    unlocked: true,
    isComingSoon: false,
    levels: chapter01Levels,
  },
  {
    id: 2,
    title: 'Chapter 2: Pods & Lifecycle',
    description: 'Master Pod lifecycle states: Pending, ContainerCreating, Running, CrashLoopBackOff, and ImagePullBackOff.',
    badge: 'PODS',
    unlocked: false,
    isComingSoon: true,
    levels: [],
  },
  {
    id: 3,
    title: 'Chapter 3: Deployments & ReplicaSets',
    description: 'Master self-healing workloads, controller reconciliation, rolling updates, rollbacks, and replica scaling.',
    badge: 'DEPLOY',
    unlocked: false,
    isComingSoon: true,
    levels: [],
  },
  {
    id: 4,
    title: 'Chapter 4: Services & Networking',
    description: 'ClusterIP, NodePort, LoadBalancer, Service selectors, and Endpoint routing.',
    badge: 'NETWORKING',
    unlocked: false,
    isComingSoon: true,
    levels: [],
  },
  {
    id: 5,
    title: 'Chapter 5: Troubleshooting & Incidents',
    description: 'Node NotReady emergencies, OOMKilled vs Eviction, CPU throttling, and etcd quorum preservation.',
    badge: 'INCIDENTS',
    unlocked: false,
    isComingSoon: true,
    levels: [],
  },
];
