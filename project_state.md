# Project State: Kubernetes Defense

## 1. Project Overview
- **Product Name**: Kubernetes Defense
- **Subtitle**: Learn the Cluster. Defend the Workload.
- **Concept**: Interactive Kubernetes educational strategy/simulation game where gameplay metaphors (lanes, customer requests, defense cannons, XP) coexist with strictly accurate, authentic Kubernetes v1.30.0 mechanics (kube-apiserver admission, etcd state persistence, kube-scheduler filtering/scoring, kubelet lifecycle, allocatable capacity, and declarative YAML apply).
- **Current Status**: Complete Authoritative State Machine & Kubernetes Mechanics Engine implemented and verified with 18/18 passing automated unit/integration tests and clean production builds.

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, HTML5 Canvas 2D (Entity & Battlefield Rendering), Lucide Icons, Web Audio API Sound Synthesizer Engine, Canvas Confetti.
- **Simulator**: Upstream Kubernetes v1.30.0 aligned control plane engine (`ClusterSimulator.ts`, `Scheduler.ts`, `CommandParser.ts`, `imageUtils.ts`, `manifestCatalog.ts`).
- **State Machine & Bus**: Unified authoritative finite state machine (`useGameStore.ts`), Domain Event Bus (`GameEventBus.ts`), Entity Manager with cross-lane projectile physics (`EntityManager.ts`, `CanvasRenderer.ts`).
- **Backend**: Go (Go 1.22+), REST API, Server-Sent Events (SSE) stream, Modular Simulation Engine (`k8s-defense-api`).
- **Visual Design System**: Deep Midnight Graphite theme (`#060810`), Kubernetes Royal Blue (`#4D8DFF`), Aqua (`#4FD1C5`), Emerald (`#64D98B`), Amber (`#E5B567`), Gold (`#E3BC72`), JetBrains Mono & Outfit Google Fonts, Glassmorphism, GPU-accelerated cubic-bezier transitions.
- **Deployment**: Multi-stage Containerfile, Kubernetes / OpenShift manifests (`Deployment`, `Service`).

## 3. Key Technical Mechanics & Authoritative State Architecture
- **Strict Decoupled State & Lifecycle Ordering**:
  ```
  USER COMMAND 
  ↓
  COMMAND_ACCEPTED (pod/<name> created)
  ↓
  POD_PENDING
  ↓
  SCHEDULER_STARTED (NodeResourcesFit evaluation)
  ↓
  POD_SCHEDULED(nodeName)
  ↓
  CONTAINER_CREATING (Image pull & sandbox setup)
  ↓
  POD_RUNNING
  ↓
  POD_READY (ContainersReady: True, Ready: True)
  ↓
  GAME VALIDATES ACTIVE REQUEST (Type, canonical image, resource fits)
  ↓
  REQUEST_SATISFYING (Target locked, customer motion & SLA frozen)
  ↓
  CANNON_AIMS (Turret rotates θ = atan2(ΔY, ΔX))
  ↓
  CANNON_FIRED (Physical projectile spawned with target coordinates)
  ↓
  PROJECTILE TRAVELS (Customer remains visible during in-flight vector translation)
  ↓
  PROJECTILE_HIT (Physical impact event emitted, particles spawn, customer marked SERVED)
  ↓
  REQUEST_SERVED (Customer visually fades, "REQUEST SERVED" banner appears)
  ↓
  XP_AWARDED (Exactly once: Base + No-Hint bonus)
  ↓
  SLA STREAK INCREMENTED (Exactly once)
  ↓
  NEXT REQUEST SPAWNED (After brief 600ms result feedback delay)
  ```
- **Authoritative Request Lifecycle (`types.ts`)**:
  - `RequestStatus = 'PENDING' | 'ACTIVE' | 'SATISFYING' | 'SERVED' | 'BREACHED' | 'FAILED'`
  - Guarded with `completedRequestIds: Set<string>` preventing re-satisfaction or duplicate scoring.
  - Runaway loop protection: 100 subsequent cluster state events do NOT mutate score or re-trigger satisfaction.
- **Authoritative Node Allocatable Scheduling (`Scheduler.ts`)**:
  - Filters nodes using `Allocatable - Requested >= PodRequest` (not raw Capacity), checks `Ready` status, `unschedulable` flags, and `NoSchedule` taints/tolerations.
  - Transparent `LeastAllocated` / `NodeResourcesFit` scoring formula.
- **Pending Workload Retry Queue**:
  - Pending workloads automatically retry when cluster resources are reclaimed (e.g. via `kubectl delete pod`).
- **Simulator Epoch Stale Timer Guard (`ClusterSimulator.ts`)**:
  - Generation epoch tracking ensures asynchronous `setTimeout` lifecycle callbacks from prior simulations/levels are discarded upon reset.
- **Decoupled Request Lane vs Kubernetes Node Selection (Cross-Lane Targeting)**:
  - Fictional request lane does not dictate scheduling.
  - Defense projectiles originate from the fulfilling host node (`pod.nodeName`), rotating diagonally across lanes to target the customer in their lane.
- **Progressive Hint System (`HintModal.tsx`)**:
  - Accordion style: previous unlocked hints collapse into compact rows, latest hint expanded.
  - "INSERT COMMAND" button populates terminal input without auto-running, preserving player agency and learning loop.

## 4. Verification Status
- **Automated Geometry Tests**: 7/7 unit tests passing in `tutorialGeometry.test.ts`.
- **Automated Kubernetes Mechanics Tests**: 18/18 unit, campaign, concurrency, and state machine tests passing in `k8sMechanics.test.ts`.
- **Linting**: Clean (0 errors, 0 warnings across 32 files via Oxlint).
- **TypeScript & Build**: Clean production build via `tsc -b && vite build` in <600ms.
