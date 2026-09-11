export interface VirtualManifest {
  filename: string;
  kind: 'Pod';
  name: string;
  image: string;
  cpuRequest?: number;
  memoryRequest?: number;
  cpuLimit?: number;
  memoryLimit?: number;
  yamlContent: string;
}

export const VIRTUAL_MANIFESTS: Record<string, VirtualManifest> = {
  'compute-01.yaml': {
    filename: 'compute-01.yaml',
    kind: 'Pod',
    name: 'compute-01',
    image: 'nginx',
    cpuRequest: 0.5, // 500m
    memoryRequest: 256, // 256Mi
    yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: compute-01
  labels:
    app: compute
spec:
  containers:
  - name: compute
    image: nginx
    resources:
      requests:
        cpu: "500m"
        memory: "256Mi"`,
  },
  'db-01.yaml': {
    filename: 'db-01.yaml',
    kind: 'Pod',
    name: 'db-01',
    image: 'redis',
    cpuRequest: 0.25, // 250m
    memoryRequest: 1024, // 1024Mi (1Gi)
    yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: db-01
  labels:
    app: cache-db
spec:
  containers:
  - name: redis
    image: redis
    resources:
      requests:
        cpu: "250m"
        memory: "1024Mi"`,
  },
  'gateway-01.yaml': {
    filename: 'gateway-01.yaml',
    kind: 'Pod',
    name: 'gateway-01',
    image: 'nginx',
    cpuRequest: 1.0, // 1000m
    memoryRequest: 2048, // 2048Mi (2Gi)
    yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: gateway-01
  labels:
    app: enterprise-gateway
spec:
  containers:
  - name: gateway
    image: nginx
    resources:
      requests:
        cpu: "1000m"
        memory: "2048Mi"`,
  },
  'big-cache.yaml': {
    filename: 'big-cache.yaml',
    kind: 'Pod',
    name: 'big-cache',
    image: 'redis',
    cpuRequest: 0.5,
    memoryRequest: 16384, // 16Gi - purposefully exceeds all node allocatable to teach FailedScheduling!
    yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: big-cache
  labels:
    app: high-memory-cache
spec:
  containers:
  - name: redis
    image: redis
    resources:
      requests:
        cpu: "500m"
        memory: "16Gi"`,
  },
  'web-pod.yaml': {
    filename: 'web-pod.yaml',
    kind: 'Pod',
    name: 'web-01',
    image: 'nginx',
    cpuRequest: 0.25,
    memoryRequest: 256,
    yamlContent: `apiVersion: v1
kind: Pod
metadata:
  name: web-01
  labels:
    app: web
spec:
  containers:
  - name: web
    image: nginx
    resources:
      requests:
        cpu: "250m"
        memory: "256Mi"`,
  },
};
