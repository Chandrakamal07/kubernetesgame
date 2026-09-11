# OpenShift Defense: Technical Architecture

## 1. Executive Summary
**OpenShift Defense** ("Learn the Cluster. Defend the Workload.") is an interactive Kubernetes and OpenShift educational game built with React 19, TypeScript, HTML5 Canvas, and Go. The game maps technical customer requests into incoming units travelling down defense lanes. Players satisfy requests via an authentic OpenShift Bastion terminal (`oc` CLI), which triggers real Kubernetes pod lifecycles (`Pending` -> `ContainerCreating` -> `Running`) and automated Kube-Scheduler node placement.

## 2. Core Metaphor & Mechanics
```
CUSTOMER REQUEST (Incoming Unit)
       ↓
PLAYER ENTERS COMMAND (oc run / oc get / oc describe)
       ↓
KUBE-APISERVER & ETCD (Schema Validation & Object Creation)
       ↓
KUBE-SCHEDULER (Filtering & Scoring across Worker-1, Worker-2, Worker-3)
       ↓
KUBELET & CRI-O (Image Pull & Container Startup)
       ↓
POD REACHES 'RUNNING' (Defense Capacity Generated)
       ↓
WORKER CANNON LOADS AMMUNITION & FIRES PROJECTILE
       ↓
CUSTOMER REQUEST RESOLVED (+XP & SLA Streak Combo)
```

## 3. Technology Stack & Subsystems
- **Battlefield Renderer**: HTML5 Canvas 2D engine operating at 60 FPS for particle explosions, laser projectiles, turret recoil, and animated customer units.
- **Terminal Engine**: Robust AST command parser supporting `oc get nodes`, `oc get pods -o wide`, `oc run`, `oc describe`, `oc delete`, and flag variations with authentic tabular formatting.
- **Scheduler Engine**: Evaluates node readiness, available CPU (`cpuCapacity - cpuAllocated`), and Memory (`memoryCapacity - memoryAllocated`), awarding points via LeastRequestedPriority.
- **Audio Synthesizer**: Procedural Web Audio API sound generator producing laser blasts, keystroke clicks, alert chirps, and victory fanfares without external audio files.
- **Learning View**: Live 6-step control-plane visualizer tracing operations across `kube-apiserver`, `etcd`, `kube-scheduler`, `kubelet`, and `CRI-O`.
- **Backend**: Go API server with REST endpoints and SSE event streaming.
