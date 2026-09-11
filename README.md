# Kubernetes Defense 🛡️
> **Learn the Cluster. Defend the Workload.**

An interactive Kubernetes educational strategy game where you defend your cluster by scheduling workloads and satisfying real customer technical requests.

---

## 🎮 Features
- **Interactive Step-by-Step Tutorial**: Comprehensive guided onboarding explaining every HUD button, worker cannons, customer requests, control plane trace, and bastion terminal with instant auto-run options and a **Skip Tutorial** button.
- **Authentic Bastion Terminal**: Execute real `kubectl` commands (`kubectl get nodes`, `kubectl get pods -o wide`, `kubectl run`, `kubectl describe node`, `kubectl delete pod`) with command history, tab autocomplete, and colored tabular output.
- **60 FPS Canvas Battlefield**: 3 defense lanes powered by Worker Node Cannons (`worker-1`, `worker-2`, `worker-3`), animated customer units, energy projectile lasers, and particle explosions.
- **Realistic Kube-Scheduler**: Visual node filtering and scoring based on available CPU/Memory resources.
- **Live Control Plane Tracer**: Step-by-step technical view showing operations across `kube-apiserver`, `etcd`, `kube-scheduler`, `kubelet`, and container runtime.
- **Progressive Technical Hints**: 4 tiers of hints with calibrated score deductions to support learners of all skill levels.
- **Native Web Audio Synthesizer**: Zero external sound dependencies — laser blasts, alerts, typing clicks, and victory fanfares generated via Web Audio API.

---

## 🚀 Quick Start

### Frontend (Local Development)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend (Go Server)
```bash
cd backend
go run cmd/server/main.go
```

---

## 📜 License
Apache-2.0
