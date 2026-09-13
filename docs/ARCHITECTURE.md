# Kubernetes Defense: Technical Architecture & Systems Specification

## 1. Executive Summary
**Kubernetes Defense** ("*Learn Kubernetes by keeping a cluster running.*") is a beginner-first educational strategy game and cluster simulation command-center built with React 19, TypeScript, HTML5 Canvas 2D, and Go. The game teaches upstream Kubernetes v1.30.0 mechanics (kube-apiserver admission, etcd state persistence, kube-scheduler filtering/scoring, kubelet container lifecycle, allocatable capacity, and declarative YAML apply) in an approachable, beginner-friendly simulation.

---

## 2. Pedagogical Architecture & Three Learning Modes

The fundamental pedagogical rule of the game is:
> **Teach first, demonstrate second, guide the learner through practice third, and only then test the learner independently.**

```
LEARNING MODES
├── LEARN (Default for Beginners)
│   ├── No countdown timers
│   ├── No hint penalties
│   ├── Token-by-token guided command breakdowns
│   └── Infinite safe retries
│
├── PRACTICE (For Concept Reinforcement)
│   ├── Summary mission goals
│   ├── Optional command builder
│   └── Progressive hints with zero double penalties
│
└── CHALLENGE (For Experienced Learners)
    ├── Optional Time to Impact
    ├── Score & Success Streak multipliers
    └── Recoverable failure review states
```

---

## 3. Decoupled State Architecture

State is partitioned into three independent domains:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHORITATIVE STATE ARCHITECTURE                     │
├──────────────────────────┬────────────────────────────┬─────────────────────┤
│   KubernetesClusterState │   LearningProgressState    │GamePresentationState│
├──────────────────────────┼────────────────────────────┼─────────────────────┤
│ • nodes: K8sNode[]       │ • mode: LearningMode       │ • coreIntegrity: %  │
│ • pods: K8sPod[]         │ • activeLessonId: string   │ • activeEffects:    │
│ • events: ClusterEvent[] │ • completedLessonIds: Set  │   VisualEffect[]    │
│ • clock: SimulationClock │ • score: number            │ • isPaused: boolean │
│                          │ • successStreak: number    │ • isMuted: boolean  │
└──────────────────────────┴────────────────────────────┴─────────────────────┘
```

1. **Kubernetes Cluster State**: Authentic Kubernetes v1.30.0 objects (`K8sNode`, `K8sPod`, `ClusterEvent`).
2. **Learning Progress State**: Tracked in `useGameStore` and persisted to `localStorage` (`PersistedProgressV1`).
3. **Game Presentation State**: Fictional Core Integrity, visual laser/scan pulses, and audio synthesis.

---

## 4. Deterministic Simulation Clock (`SimulationClock.ts`)

All asynchronous cluster lifecycle steps are governed by a deterministic virtual clock:
- **Pausable**: Pausing halts the virtual timestamp without losing in-flight state.
- **Per-Object Scoped Cancellation**: `deletePod(uid)` calls `clock.cancelScope('pod:' + uid)`, eliminating ghost pods and preventing stale callbacks from corrupting resource counters.
- **Fast-Forward Unit Testing**: Unit tests advance virtual time instantly via `clock.advance(ms)` without sleeping real-world seconds.

---

## 5. Technology Stack & Subsystems
- **Battlefield Engine**: HTML5 Canvas 2D running at 60 FPS rendering worker node allocatable gauges, active Pod chips, scan waves, and service shields.
- **Terminal Engine**: Robust AST parser supporting `kubectl get`, `kubectl describe`, `kubectl run`, `kubectl apply -f`, `kubectl create -f`, and `kubectl delete pod` with output printers (`-o wide`, `-o json`, `-o yaml`, `-o name`).
- **Audio Synthesizer**: Procedural Web Audio API sound generator producing laser blasts, keystroke clicks, alert chirps, and victory fanfares without external audio files.
- **Stateless Backend**: Go server serving static SPA assets and Kubernetes `/healthz` probes, enabling safe multi-replica scaling on OpenShift.
