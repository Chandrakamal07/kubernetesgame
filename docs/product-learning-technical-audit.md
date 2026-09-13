# Kubernetes Defense: Product Learning & Technical Audit

**Audit Date**: September 2026  
**Auditor**: Senior Game Systems Engineer, Kubernetes SME, & QA Automation Owner  
**Repository**: `Chandrakamal07/kubernetesgame` (Local Workspace)  
**Baseline Git Commit**: `12a889633bfd93812f3fad8f0381fe36299f0b39` (`version-2`)  

---

## 1. Executive Summary & Baseline Validation Results

### 1.1 Baseline Validation Results (Executed on `version-2`)
- **OxLint**: Clean — 0 errors, 0 warnings across 32 files (631ms).
- **TypeScript & Vite Build**: `tsc -b && vite build` built successfully in 3.48s (`dist/index.html` 1.07 kB, `dist/assets/index.css` 51.15 kB, `dist/assets/index.js` 361.22 kB).
- **Existing Unit Tests**:
  - `tutorialGeometry.test.ts`: 7/7 tests passed.
  - `k8sMechanics.test.ts`: 18/18 tests passed (running against synchronous mock intervals).
- **Baseline Shortcomings Identified**:
  1. Unit tests relied on `setTimeout` delays in simulator, taking 20.2s to complete.
  2. Zero integration tests for UI state-derived entity mounting.
  3. Zero automated end-to-end browser / Playwright tests for beginner progression, responsive layout, or error recovery.
  4. Fictional concepts (Customer requests, SLA, briefcases, ammo cannons, node health damage) were deeply coupled into core types and state machines.

---

## 2. Terminology Audit & Systematic Replacement Matrix

| Current / Legacy Term | Replacement Term | Justification & Teaching Scope |
| :--- | :--- | :--- |
| **Customer Request** | **Mission** | Eliminates enterprise ticketing distraction; focuses learner on technical cluster objectives. |
| **Customer** | **Mission Signal** or **Workload Signal** | Abstract data packet or traffic requirement representing workload demand. |
| **Request Details** | **Mission Goal** | Clear plain-language statement of what the learner needs to accomplish. |
| **Request Served** | **Mission Complete** | Clear pedagogical affirmation of successful workload lifecycle execution. |
| **SLA** | *Removed from Learn & Practice modes* | SLA is a business contract metric, not a Kubernetes primitive. Taught only in Challenge mode. |
| **SLA timer** | **Time to Impact** *(Challenge mode only)* | Replaces arbitrary corporate countdown with an active defensive metaphor. |
| **SLA streak** | **Success Streak** | Clear educational metric celebrating consecutive error-free mission completions. |
| **Escalation** | **Critical Challenge** | Replaces customer escalation with an advanced workload scenario. |
| **Cluster Health** *(Fictional)* | **Core Integrity** | Fictional shield integrity. Decoupled from real Kubernetes `NodeCondition.Ready`. |
| **XP Awarded** | **Points Earned** | Clean, understandable progression metric. |
| **Bastion Terminal** | **Kubernetes Terminal** | Subtitle: *Safe browser simulation — no real cluster is modified*. Clarifies sandbox safety. |
| **Control Plane Trace** | **What Kubernetes Is Doing** | Approachable phrasing for the 6-step control plane visualizer. |
| **Ingress Lane** | **Mission Path** | Eliminates confusing misuse of the Kubernetes `Ingress` networking API. |
| **Academy Drill** | **Guided Lesson** | Friendly, instructional terminology for beginners. |
| **OpenShift Defense / `oc`** | **Kubernetes Defense / `kubectl`** | Unifies product identity around upstream Kubernetes v1.30.0. Removes unsupported `oc` prompts. |

---

## 3. Curriculum & Mission Completion Conditions (Chapter 1)

All missions in Chapter 1 adhere to the **Beginner-First Learning Rule**: *Teach first, demonstrate second, guide third, test independently fourth.*

```
Chapter 1: Nodes & Scheduling
├── Lesson 0: Meet the Cluster (Component discovery & visual architecture)
├── Lesson 1: Ask Kubernetes What Exists (kubectl get nodes)
├── Lesson 2: Pods and Container Images (Concept introduction + nginx card)
├── Lesson 3: Create the First Pod (kubectl run web-01 --image=nginx)
├── Lesson 4: Watch the Pod Lifecycle (kubectl get pods, Pending -> Running -> Ready)
├── Lesson 5: Find Where the Pod Runs (kubectl get pods -o wide)
├── Lesson 6: Capacity, Allocatable & Requests (compute-01.yaml & db-01.yaml)
├── Lesson 7: Why a Pod Can Stay Pending (big-cache.yaml diagnostic lesson)
├── Lesson 8: Clean Up Safely (kubectl delete pod big-cache, bare pod deletion)
└── Chapter 1 Challenge: Final Integrated Cluster Defense
```

### Mission Specifications:
1. **Lesson 0: Meet the Cluster**
   - *Kind*: Interactive Component Inspection.
   - *Goal*: Click and inspect Control Plane, Worker Nodes, and Workload Paths.
   - *Prerequisites*: None.
   - *Completion*: All 3 cluster components inspected.
2. **Lesson 1: Ask Kubernetes What Exists**
   - *Kind*: `COMMAND`
   - *Command*: `kubectl get nodes`
   - *Taught Tokens*: `kubectl` (Talk to cluster), `get` (List resources), `nodes` (Worker machines).
   - *Completion*: Successful execution of `kubectl get nodes` (or `-o wide`).
3. **Lesson 2: Pods and Container Images**
   - *Kind*: Interactive Card Review.
   - *Goal*: Learn what a Pod and Container Image are before typing commands.
   - *Taught Values*: `nginx` web-server image.
   - *Completion*: Concept card acknowledged.
4. **Lesson 3: Create the First Pod**
   - *Kind*: `STATE`
   - *Command*: `kubectl run web-01 --image=nginx`
   - *Taught Inputs*: Pod name `web-01`, image `nginx`.
   - *Completion*: Pod `web-01` scheduled, running, and `Ready == True`.
5. **Lesson 4: Watch the Pod Lifecycle**
   - *Kind*: `COMMAND`
   - *Command*: `kubectl get pods`
   - *Taught Tokens*: `get pods`, `ContainerCreating` waiting state vs `Running` phase.
   - *Completion*: Pod list rendered.
6. **Lesson 5: Find Where the Pod Runs**
   - *Kind*: `COMMAND`
   - *Command*: `kubectl get pods -o wide`
   - *Taught Tokens*: `-o wide` flag, `NODE` column, `IP` column.
   - *Completion*: `kubectl get pods -o wide` executed.
7. **Lesson 6: Capacity, Allocatable & Requests**
   - *Kind*: `STATE`
   - *Command*: `kubectl apply -f compute-01.yaml`
   - *Taught Inputs*: `compute-01.yaml` (500m CPU request), `db-01.yaml` (1024Mi RAM request).
   - *Completion*: `compute-01` scheduled, running, and Ready on eligible node.
8. **Lesson 7: Why a Pod Can Stay Pending (Diagnosis)**
   - *Kind*: `STATE` / Diagnostic
   - *Command*: `kubectl apply -f big-cache.yaml` followed by `kubectl describe pod big-cache`
   - *Taught Inputs*: `big-cache.yaml` (16Gi RAM request exceeding node allocatable).
   - *Completion*: Pod in `Pending` with `FailedScheduling` event inspected via `describe`.
9. **Lesson 8: Clean Up Safely**
   - *Kind*: `STATE`
   - *Command*: `kubectl delete pod big-cache`
   - *Taught Tokens*: `delete pod <name>`, bare Pod removal does not self-heal.
   - *Completion*: Pod `big-cache` removed from cluster state.
10. **Chapter 1 Challenge: Final Integrated Cluster Defense**
    - *Kind*: Multi-Step Independent Challenge (Inspect -> Apply -> Verify -> Diagnose -> Delete).

---

## 4. Supported Terminal Commands & Format Matrix

| Command | Supported Flags | Behavior & Simulator Output |
| :--- | :--- | :--- |
| `kubectl get nodes` | `-o wide`, `-o json`, `-o yaml`, `-o name` | Lists worker nodes with status, roles, age, version, IP, and allocatable specs. |
| `kubectl get pods` | `-o wide`, `-o json`, `-o yaml`, `-o name` | Lists pods with ready count, lifecycle status, restart count, age, IP, and node placement. |
| `kubectl describe node <name>` | *(none)* | Generates authentic describe output including Capacity, Allocatable, Allocated Resources %, and non-terminated pods. |
| `kubectl describe pod <name>` | *(none)* | Generates authentic pod describe output with Conditions, Resource Requests/Limits, Container State, and real chronological Events. |
| `kubectl run <name> --image=<img\>` | `--image`, `--overrides` | Validates name & image, performs admission defaulting (0 default request), persists to etcd, and begins scheduler pipeline. |
| `kubectl apply -f <file.yaml>` | `-f`, `--filename` | Declarative apply: creates object if absent; returns `unchanged` if identical; updates if supported. |
| `kubectl create -f <file.yaml>` | `-f`, `--filename` | Imperative create: creates object; returns `Error from server (AlreadyExists)` if object exists. |
| `kubectl delete pod <name>` | *(none)* | Deletes Pod from cluster state, cancels pending timers, reclaims node resources, and triggers retry queue. |
| `kubectl cluster-info` | *(none)* | Displays simulated API server and CoreDNS addresses. |
| `kubectl explain <resource>` | `pod`, `node` | Educational documentation on Kubernetes resource kinds. |
| `ls` / `dir` | *(none)* | Lists available training manifests (`compute-01.yaml`, `db-01.yaml`, `big-cache.yaml`, `gateway-01.yaml`). |
| `cat <file.yaml>` | *(none)* | Displays the YAML contents of a manifest. |
| `clear` (or Ctrl+L) | *(none)* | Clears terminal scrollback. |
| `help` | *(none)* | Displays command cheat-sheet and usage examples. |

---

## 5. Game State vs Kubernetes State Separation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHORITATIVE STATE ARCHITECTURE                     │
├──────────────────────────┬────────────────────────────┬─────────────────────┤
│   KubernetesClusterState │   LearningProgressState    │GamePresentationState│
├──────────────────────────┼────────────────────────────┼─────────────────────┤
│ • nodes: K8sNode[]       │ • mode: LearningMode       │ • coreIntegrity: %  │
│   (Capacity, Allocatable,│   ('LEARN' | 'PRACTICE' |  │ • activeEffects:    │
│    Requested, Conditions,│    'CHALLENGE')            │   VisualEffect[]    │
│    Labels, Taints)       │ • activeLessonId: string   │ • isPaused: boolean │
│ • pods: K8sPod[]         │ • completedLessonIds: Set  │ • isMuted: boolean  │
│   (UID, Name, Phase,     │ • score: number            │ • terminalExpanded  │
│    Conditions, Resources)│ • successStreak: number    │ • activeTab:        │
│ • events: ClusterEvent[] │ • persistedProgress: V1    │   'mission' |       │
│ • simulationClock: Clock │ • recoverableError?: string│   'tracer' | 'gloss'│
└──────────────────────────┴────────────────────────────┴─────────────────────┘
```

### State Separation Rules:
1. **Zero Fictional Fields in Kubernetes Types**: `K8sNode` contains strictly authentic Kubernetes v1.30.0 properties (`name`, `role`, `status`, `cpuCapacity`, `memoryCapacity`, `cpuAllocatable`, `memoryAllocatable`, `cpuRequested`, `memoryRequested`, `pods`, `labels`, `taints`, `conditions`).
2. **Zero Fictional State Mutations**: Missing a lesson or SLA expiration NEVER alters `Node.status` to `NotReady` or generates fake kubelet hardware crashes.
3. **Presentation Derived From Entities**: Turret angles, laser beams, diagnostic pulses, and particle explosions live strictly in `EntityManager` and `CanvasRenderer`.

---

## 6. Simulation Clock & Deterministic Lifecycle

```
[CLI COMMAND] 
      ↓
[API Server Admission & Validation] (Sync return: pod/<name> created)
      ↓ (SimulationClock schedule: +180ms)
[etcd Persisted Event]
      ↓ (SimulationClock schedule: +270ms)
[Scheduler NodeResourcesFit Evaluation]
      ↓
   ┌──┴───────────────────────────────────────┐
   │ (Feasible Node Found)                    │ (No Node Fits Allocatable)
   ↓                                          ↓
[Pod Bound to Node]                        [Pod Remains Pending]
   ↓ (SimulationClock: +300ms)                ↓ (ClusterEvent: Warning FailedScheduling)
[kubelet Pulling & Sandbox CNI]            [Enters Retry Queue]
   ↓ (SimulationClock: +400ms)
[Container Running & Ready: True]
```

### Lifecycle Guarantees:
1. **Pausable**: Pausing halts the `SimulationClock` virtual timestamp; resuming continues remaining durations.
2. **Per-Object Scoped Cancellation**: `deletePod(uid)` calls `clock.cancelScope('pod:' + uid)`, guaranteeing zero ghost pods and preventing stale callbacks from corrupting resource counters.
3. **Deterministic Virtual Clock in Tests**: Unit tests call `clock.advance(ms)` to step time instantly without real-world sleeping.

---

## 7. Domain EventBus Architecture

| Event | Producer | Consumer(s) | Payload Structure |
| :--- | :--- | :--- | :--- |
| `POD_CREATED` | `ClusterSimulator.createPod` | `KubernetesActivityPanel`, `CanvasRenderer` | `{ podUid: string, pod: K8sPod }` |
| `POD_SCHEDULED` | `ClusterSimulator.schedulePod` | `EntityManager` (spawns Workload Capsule) | `{ podUid: string, nodeName: string }` |
| `POD_READY` | `ClusterSimulator.schedulePod` | `useGameStore` (evaluates objectives), `EntityManager` (activates service beam) | `{ podUid: string, nodeName: string }` |
| `POD_DELETED` | `ClusterSimulator.deletePod` | `useGameStore`, `EntityManager` (fades entity) | `{ podUid: string, podName: string }` |
| `SCAN_PULSE_REQUESTED` | `useGameStore.executeCommand` (`get`) | `EntityManager` (spawns control-plane scan pulse) | `{ targetType: 'nodes' \| 'pods' }` |
| `DIAGNOSTIC_SCAN_REQUESTED` | `useGameStore.executeCommand` (`describe`)| `EntityManager` (spawns magnifying diagnostic wave)| `{ targetName: string }` |
| `MISSION_SATISFIED` | `useGameStore.evaluateActiveObjective` | `EntityManager`, `AudioEngine` | `{ missionId: string, effect: VisualEffectType }` |
| `MISSION_COMPLETED` | `useGameStore.finalizeMission` | `GameHUD`, `LevelCompleteModal`, `soundEngine` | `{ missionId: string, points: number }` |
| `MISSION_FAILED` | `useGameStore.handleFailure` | `GameOverModal`, `soundEngine` | `{ missionId: string, reason: string }` |
| `INSERT_TERMINAL_INPUT` | `MissionPanel`, `HintModal` | `BastionTerminal` (populates input without auto-running)| `{ command: string }` |

---

## 8. Frontend / Backend Ownership & OpenShift Deployment

- **Frontend (SPA)**: The single source of authoritative gameplay simulation runs in the browser via React 19, TypeScript, and the client-side `ClusterSimulator`.
- **Backend (Go)**:
  - Serves compiled static SPA assets (`./frontend/dist`).
  - Implements lightweight `/healthz` liveness & readiness probe endpoint.
  - Purely stateless: zero session memory or in-flight timers.
- **OpenShift Multi-Pod Scalability**: Because the Go backend is stateless, multi-replica deployments (e.g. 2 or more pods in `deployment.yaml`) operate safely without sticky sessions or state conflicts.

---

## 9. Automated Testing Strategy & Coverage Matrix

### 9.1 Unit Tests (`npm run test:unit`)
- `scenarios/missionCompleteness.test.ts`: Validates that every lesson goal provides/teaches all required Pod names, images, manifests, and flags before execution.
- `simulator/simulationClock.test.ts`: Verifies virtual clock pause/resume, scoped UID cancellation, and absence of stale callbacks.
- `simulator/k8sMechanics.test.ts`: Complete 18-rule audit test suite executing under virtual time.

### 9.2 Playwright End-to-End Tests (`npm run test:e2e`)
- `beginner-journey.spec.ts`: End-to-end traversal from Home Screen -> Learn Mode -> Lessons 0–8 -> Chapter Challenge -> LocalStorage persistence reload.
- `error-recovery.spec.ts`: Validates wrong-image recovery guidance (describe -> delete -> rerun).
- `simulation-pause.spec.ts`: Confirms pause halts scheduling and resume finishes lifecycle cleanly.
- `responsive-viewports.spec.ts`: Validates 8 viewport dimensions (1920x1080 to 360x800) for zero horizontal overflow and captures screenshots.
