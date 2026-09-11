# Project State: Kubernetes Defense

## 1. Project Overview
- **Product Name**: Kubernetes Defense
- **Subtitle**: Learn the Cluster. Defend the Workload.
- **Concept**: Interactive Kubernetes educational strategy/simulation game where gameplay metaphors (lanes, customer requests, defense cannons, XP) coexist with strictly accurate, authentic Kubernetes v1.30.0 mechanics (kube-apiserver admission, etcd state persistence, kube-scheduler filtering/scoring, kubelet lifecycle, allocatable capacity, and declarative YAML apply).
- **Current Status**: Complete Kubernetes Mechanics Audit and Correction Pass verified with 14/14 passing automated unit/integration tests and clean production builds.

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, HTML5 Canvas 2D (Entity & Battlefield Rendering), Lucide Icons, Web Audio API Sound Synthesizer Engine, Canvas Confetti.
- **Simulator**: Upstream Kubernetes v1.30.0 aligned control plane engine (`ClusterSimulator.ts`, `Scheduler.ts`, `CommandParser.ts`, `imageUtils.ts`, `manifestCatalog.ts`).
- **Backend**: Go (Go 1.22+), REST API, Server-Sent Events (SSE) stream, Modular Simulation Engine (`k8s-defense-api`).
- **Visual Design System**: Deep Midnight Graphite theme (`#060810`), Kubernetes Royal Blue (`#4D8DFF`), Aqua (`#4FD1C5`), Emerald (`#64D98B`), Amber (`#E5B567`), Gold (`#E3BC72`), JetBrains Mono & Outfit Google Fonts, Glassmorphism, GPU-accelerated cubic-bezier transitions.
- **Deployment**: Multi-stage Containerfile, Kubernetes / OpenShift manifests (`Deployment`, `Service`).

## 3. Key Technical Mechanics & Upstream Correctness
- **Decoupled Command Success vs Workload Readiness**:
  - `kubectl run` / `kubectl apply` returns object creation success immediately (`pod/<name> created`).
  - Game objective is NOT completed until the Pod is scheduled, container runtime starts the workload, and the Pod reaches `Running` and `Ready` status (`ready: true`, conditions `ContainersReady: True`, `Ready: True`).
- **Authoritative Node Allocatable Scheduling**:
  - `Scheduler.ts` filters nodes using `Allocatable - Requested >= PodRequest` (not raw Capacity), checks `Ready` status, `unschedulable` flags, and `NoSchedule` taints/tolerations.
  - Transparent `LeastAllocated` / `NodeResourcesFit` scoring formula.
- **Pending Workload Retry Queue**:
  - Pending workloads automatically retry when cluster resources are reclaimed (e.g. via `kubectl delete pod`).
- **Decoupled Request Lane vs Kubernetes Node Selection (Cross-Lane Targeting)**:
  - Fictional request lane does not dictate scheduling.
  - Defense projectiles originate from the fulfilling host node (`pod.nodeName`), rotating diagonally across lanes to target the customer in their lane.
- **Strict Option & Syntax Parsing**:
  - Reusable flag parser distinguishes `-o wide` / `--output=wide` from `-o json` / `-o yaml`.
  - Declarative YAML support (`kubectl apply -f <manifest.yaml>`) for realistic resource requests (`500m` CPU, `1024Mi` RAM, `16Gi` failed scheduling).
  - Accurate `kubectl describe node` and `kubectl describe pod` outputs derived strictly from live simulator state and actual lifecycle events.
- **Single Authoritative SLA Clock**:
  - Customer entity motion is strictly derived from `progress = 1 - (remainingSla / totalSla)`. Game pause halts motion, SLA countdown, and simulator state machines simultaneously.

## 4. Verification Status
- **Automated Geometry Tests**: 7/7 unit tests passing in `tutorialGeometry.test.ts`.
- **Automated Kubernetes Mechanics Tests**: 13/13 unit and sequential campaign tests passing in `k8sMechanics.test.ts` (14/14 overall test suite).
- **Linting**: Clean (0 errors, 0 warnings across 32 files via Oxlint).
- **TypeScript & Build**: Clean production build via `tsc -b && vite build` in <1s.
