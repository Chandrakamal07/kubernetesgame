# Project State: Kubernetes Defense

## 1. Project Overview
- **Product Name**: Kubernetes Defense
- **Subtitle**: Learn the Cluster. Defend the Workload.
- **Concept**: Interactive Kubernetes educational strategy/simulation game built on lane-defense mechanics where customer technical requests are incoming units and running workloads generate defense capacity on worker node cannons.
- **Current Status**: Complete UI/UX redesign and visual polish pass executed. Elevated to an ultra-premium dark strategy game experience with dynamic SVG spotlight masks, directional guide arrows, target ripple rings, refined HUD telemetry, and authentic Bastion terminal styling.

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, HTML5 Canvas 2D (Entity & Battlefield Rendering), Lucide Icons, Web Audio API Sound Synthesizer Engine, Canvas Confetti.
- **Backend**: Go (Go 1.22+), REST API, Server-Sent Events (SSE) stream, Modular Simulation Engine.
- **Visual Design System**: Deep Midnight Graphite theme (`#060810`), Kubernetes Royal Blue (`#4D8DFF`), Aqua (`#4FD1C5`), Emerald (`#64D98B`), Amber (`#E5B567`), Gold (`#E3BC72`), JetBrains Mono & Outfit Google Fonts, Glassmorphism, GPU-accelerated cubic-bezier transitions.
- **Deployment**: Containerfile, Kubernetes manifests (`Deployment`, `Service`, `Ingress`, `ConfigMap`).

## 3. Key Components & Features
- **Game-Quality Interactive Tutorial (`InteractiveTutorial.tsx` & `tutorialGeometry.ts`)**: 11-step interactive onboarding with a unified viewport-based positioning engine (`calculateCoachmarkPlacement`, `calculateArrowGeometry`, `clampToViewport`), viewport-level SVG layer with directional Bezier arrow and arrowhead marker, transparent SVG spotlight cutout mask, target neon border and signal pulse, automatic terminal input focus, dual interactive drill execution (manual typing + auto-run chip), and guaranteed button containment without viewport/card overflow.
- **Consolidated Strategic HUD (`GameHUD.tsx`)**: Calm, single-strip telemetry showing cluster health gradient meter, SLA streak multiplier, XP score, and unified operational controls.
- **Authentic Bastion Terminal (`BastionTerminal.tsx`)**: High-end server CLI with tabular syntax coloring, quick command chips, command history, Tab autocomplete, and terminal expansion mode.
- **Canvas 2D Battlefield (`CanvasRenderer.ts` & `BattlefieldCanvas.tsx`)**: 60 FPS rendering with refined worker node chassis, live CPU/RAM gauges, animated recoil cannons, incoming customer SLA badges, and laser projectile bursts.
- **Control Plane Live Trace (`LearningView.tsx`)**: Real-time 6-stage lifecycle trace (CLI -> API Server -> etcd -> Kube-Scheduler -> Kubelet -> Running) with active stage illumination and architectural takeaways.
- **Campaign Progression (`ChapterMapScreen.tsx` & `HomeScreen.tsx`)**: Luxury cinematic landing page and chapter tree.
- **Audio Synthesizer (`AudioEngine.ts`)**: Native Web Audio chimes, alerts, laser blasts, particle explosions, and victory fanfares.

## 4. Verification Status
- **Automated Geometry Tests**: 7/7 unit tests passing in `tutorialGeometry.test.ts`.
- **Linting**: Clean (0 errors, 0 warnings across 28 files via Oxlint).
- **TypeScript & Build**: Clean production build via `tsc -b && vite build`.

