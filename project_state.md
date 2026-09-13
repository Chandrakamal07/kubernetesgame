# Project State: Kubernetes Defense

## 1. Project Overview
- **Product Name**: Kubernetes Defense
- **Tagline**: Learn Kubernetes by keeping a cluster running.
- **Pedagogy**: Beginner-first learning journey (Teach → Demonstrate → Guide → Test independently). Zero corporate ticket jargon. Authentic Kubernetes v1.30.0 mechanics (kube-apiserver admission, etcd state persistence, kube-scheduler filtering/scoring, kubelet lifecycle, allocatable capacity, and declarative YAML apply).
- **Current Status**: Complete beginner-first learning engine, deterministic virtual clock, authentic terminology, decoupled Kubernetes state, stateless Go backend, and responsive command-center UI verified with 26/26 automated unit and scenario tests, clean Oxlint, and clean production builds.

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, HTML5 Canvas 2D (Command Center Battlefield & Action Visuals), Lucide Icons, Web Audio API Sound Synthesizer Engine, Canvas Confetti.
- **Simulator & Clock**: Upstream Kubernetes v1.30.0 aligned control plane engine (`ClusterSimulator.ts`, `Scheduler.ts`, `CommandParser.ts`, `imageUtils.ts`, `manifestCatalog.ts`) driven by deterministic, pausable `SimulationClock.ts` with per-object scoped cancellation (`pod:<uid>`).
- **Curriculum & Scenarios**: Structured 9-lesson Chapter 1 (`scenarios/chapter01.ts`) with concept definitions, plain-language goals, guided tokenized command breakdowns, required inputs, and review takeaways.
- **State Machine & Events**: Unified authoritative store (`useGameStore.ts`) with 3 learning modes (`LEARN`, `PRACTICE`, `CHALLENGE`), versioned `localStorage` persistence, Domain Event Bus (`GameEventBus.ts`), and action-specific entity manager (`EntityManager.ts`, `CanvasRenderer.ts`).
- **Stateless Backend**: Go (1.22+) REST server (`backend/cmd/server/main.go`) serving static built SPA and `/healthz` Kubernetes liveness/readiness probes.
- **Visual Design System**: Dark command-center palette (`#070B14`, `#0E1625`, `#151F31`), semantic status colors (Ready `#4ADE80`, Pending `#FBBF24`, Terminating `#FB7185`), Allocatable resource gauges, JetBrains Mono & Outfit typography, full keyboard accessibility, and WCAG AA contrast.
- **Deployment**: Multi-stage Containerfile, OpenShift / Kubernetes deployment manifests.

## 3. Key Architectural & Systems Implementations

### A. Beginner-First Curriculum Engine (`frontend/src/scenarios/`)
1. **Chapter 1: Nodes & Scheduling (Lessons 0–8 + Challenge)**:
   - **Lesson 0**: Meet the Cluster (Component Discovery: Control Plane, Worker Nodes, Pods).
   - **Lesson 1**: Ask Kubernetes What Exists (`kubectl get nodes`).
   - **Lesson 2**: Pods and Container Images (Concept Card: `nginx` taught before use).
   - **Lesson 3**: Create Your First Pod (`kubectl run web-01 --image=nginx`).
   - **Lesson 4**: Inspect the Running Pod (`kubectl describe pod web-01`).
   - **Lesson 5**: Observe Node Placement (`kubectl get pods -o wide`).
   - **Lesson 6**: Declarative YAML Apply (`kubectl apply -f compute-01.yaml` with resource requests).
   - **Lesson 7**: Diagnosing Scheduling Failures (`kubectl apply -f big-cache.yaml` exceeding Allocatable RAM).
   - **Lesson 8**: Delete Workload & Resource Reclamation (`kubectl delete pod big-cache`).
   - **Chapter 1 Challenge**: Cluster Defense (Independent multi-step challenge with timer & multiplier).
2. **Pedagogical Structure (`types.ts`)**:
   - Every lesson includes `teach` (summary, concepts with plain/technical meanings and analogies, why it matters), `goal` (plain language + explicit required inputs), `guidedCommand` (tokenized breakdown), `verification`, `completionRule`, and `review` (what happened + key takeaway).
   - No untaught prerequisites. Validated by automated scenario completeness validator (`missionCompleteness.test.ts`).

### B. Deterministic Virtual Simulation Clock (`frontend/src/simulator/SimulationClock.ts`)
1. Replaced uncoordinated `setTimeout` timers with discrete event simulation clock.
2. Supports pausable virtual time, relative and absolute scheduling, epoch tracking, and scoped cancellation (`cancelScope('pod:<uid>')`).
3. Deleting a Pod immediately cancels downstream scheduling, container startup, and readiness callbacks, eliminating ghost pods and timer leaks.

### C. Authentic Terminology & State Decoupling
1. Removed all confusing corporate language (Customer, SLA, Ammo, Lanes).
2. Replaced with authentic Kubernetes terms: Missions, Signals, Time to Impact (Challenge mode), Success Streak, Core Integrity.
3. Clean separation of pure Kubernetes object state (`K8sNode`, `K8sPod`) from fictional visual presentation. `K8sNode` contains strictly authentic fields (capacity, allocatable, requested, conditions, taints).

### D. Kubernetes Mechanics & Command Parser Accuracy
1. **`kubectl apply -f` vs `kubectl create -f`**: `apply` declaratively updates or creates resources; `create` strictly fails if the object already exists.
2. **Output Formatting (`-o`)**: Supports `-o wide` (NODE & IP columns), `-o json`, `-o yaml`, and `-o name`.
3. **Strict Flag Validation**: Unknown flags (e.g. `--fast`) rejected with educational advice.
4. **Mission-Aware Error Recovery**: If a user runs a pod with the wrong image (e.g. `apache` instead of `nginx`), the terminal explains the mismatch and guides them to run `kubectl delete pod web-01` before re-running.
5. **Allocatable Headroom Scheduling**: `kube-scheduler` filters nodes using `Allocatable - Requested >= PodRequest` (not raw Capacity) and filters control-plane nodes with `NoSchedule` taints.

### E. Stateless Backend & OpenShift Alignment
1. Backend (`backend/cmd/server/main.go`) is purely stateless, serving built frontend assets and `/healthz`.
2. Safe for horizontal scaling across multiple replicas without cluster state divergence.

## 4. Test & Verification Matrix
- **Unit & Scenario Completeness Tests**: 26/26 passing (Node.js test runner):
  - `tutorialGeometry.test.ts`: 7 tests passing (viewport clamping, coachmark placements, arrow geometry).
  - `missionCompleteness.test.ts`: 2 tests passing (input completeness, curriculum progression, nginx taught before use).
  - `k8sMechanics.test.ts`: 12 tests passing (lifecycle sequencing, allocatable filtering, output printers, declarative apply, describe node/pod formatting, taints/tolerations, error recovery).
  - `simulationClock.test.ts`: 5 tests passing (virtual advancement, pause, scoped cancellation, ghost pod prevention, resource reclamation).
- **Linter**: Oxlint passing with 0 errors and 0 warnings across all 37 frontend files.
- **Type Checking & Production Build**: `tsc -b && vite build` passing with zero errors.

## 5. Git Status
- **Current Branch**: `version-2`
- **Working Tree**: Clean modifications staged in local workspace, zero unrequested commits, zero remote pushes, zero PRs.
