import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  CornerDownLeft,
} from 'lucide-react';
import type {
  TargetRect,
  CoachmarkPlacement,
  ArrowGeometry,
  ViewportSize,
} from './tutorialGeometry';
import {
  TARGET_PADDING,
  getTargetRect,
  calculateCoachmarkPlacement,
  calculateArrowGeometry,
} from './tutorialGeometry';

interface TutorialStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  badge: string;
  title: string;
  instruction: string;
  targetSelector?: string;
  preferredPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  interactiveAction?: {
    label: string;
    command: string;
  };
}

export const InteractiveTutorial: React.FC = () => {
  const { isTutorialActive, tutorialStep, lastCommand, actions } = useGameStore();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [placement, setPlacement] = useState<CoachmarkPlacement>({
    top: 100,
    left: 100,
    placement: 'center',
  });
  const [arrowGeometry, setArrowGeometry] = useState<ArrowGeometry | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);

  const steps: TutorialStep[] = [
    {
      id: 'welcome',
      stepNumber: 1,
      totalSteps: 11,
      badge: 'ACADEMY',
      title: 'Welcome, Cadet',
      instruction:
        'Incoming technical customer requests travel toward your cluster. Deploy workloads to defend it.',
      preferredPlacement: 'center',
    },
    {
      id: 'hud-health',
      stepNumber: 2,
      totalSteps: 11,
      badge: 'TELEMETRY',
      title: 'Cluster Health',
      instruction:
        'Keep this healthy by fulfilling customer requests before their SLA expires.',
      targetSelector: '[data-tutorial="hud-health"]',
      preferredPlacement: 'bottom',
    },
    {
      id: 'hud-xp',
      stepNumber: 3,
      totalSteps: 11,
      badge: 'PROGRESSION',
      title: 'XP & Score',
      instruction:
        'Earn XP and build SLA streak multipliers with accurate Kubernetes commands.',
      targetSelector: '[data-tutorial="hud-xp"]',
      preferredPlacement: 'bottom',
    },
    {
      id: 'worker-nodes',
      stepNumber: 4,
      totalSteps: 11,
      badge: 'TOPOLOGY',
      title: 'Worker Nodes',
      instruction:
        'These 3 worker nodes host your container workloads and power defense cannons.',
      targetSelector: '[data-tutorial="battlefield"]',
      preferredPlacement: 'right',
    },
    {
      id: 'request-panel',
      stepNumber: 5,
      totalSteps: 11,
      badge: 'OBJECTIVE',
      title: 'Incoming Request',
      instruction:
        'Check what the customer needs here before entering your command.',
      targetSelector: '[data-tutorial="request-panel"]',
      preferredPlacement: 'left',
    },
    {
      id: 'bastion-terminal',
      stepNumber: 6,
      totalSteps: 11,
      badge: 'COMMAND CLI',
      title: 'Command Terminal',
      instruction:
        'Execute your kubectl commands here to schedule workloads and counter traffic.',
      targetSelector: '[data-tutorial="terminal-input"]',
      preferredPlacement: 'top',
    },
    {
      id: 'practice-get-nodes',
      stepNumber: 7,
      totalSteps: 11,
      badge: 'DRILL 1',
      title: 'Inspect Nodes',
      instruction:
        'Run kubectl get nodes to inspect worker node ready status.',
      targetSelector: '[data-tutorial="terminal-input"]',
      preferredPlacement: 'top',
      interactiveAction: {
        label: 'Auto-Run: kubectl get nodes',
        command: 'kubectl get nodes',
      },
    },
    {
      id: 'practice-run-pod',
      stepNumber: 8,
      totalSteps: 11,
      badge: 'DRILL 2',
      title: 'Deploy Workload',
      instruction:
        'Run kubectl run web-01 --image=nginx to schedule your first pod.',
      targetSelector: '[data-tutorial="terminal-input"]',
      preferredPlacement: 'top',
      interactiveAction: {
        label: 'Auto-Run: kubectl run web-01 --image=nginx',
        command: 'kubectl run web-01 --image=nginx',
      },
    },
    {
      id: 'hud-learning',
      stepNumber: 9,
      totalSteps: 11,
      badge: 'CONTROL PLANE',
      title: 'Learning View',
      instruction:
        'Toggle this anytime to watch how Kubernetes processes commands under the hood.',
      targetSelector: '[data-tutorial="hud-learning"]',
      preferredPlacement: 'bottom',
    },
    {
      id: 'hud-hint',
      stepNumber: 10,
      totalSteps: 11,
      badge: 'ASSISTANCE',
      title: 'Need Help?',
      instruction:
        'Use this button whenever you need progressive technical hints on syntax.',
      targetSelector: '[data-tutorial="hud-hint"]',
      preferredPlacement: 'bottom',
    },
    {
      id: 'ready-to-go',
      stepNumber: 11,
      totalSteps: 11,
      badge: 'CERTIFIED',
      title: 'You are Ready!',
      instruction:
        'You know the fundamentals. Deploy workloads, maintain health, and defend the cluster.',
      preferredPlacement: 'center',
    },
  ];

  const currentStep = steps[Math.min(tutorialStep, steps.length - 1)] || steps[0];
  const isFirstStep = tutorialStep === 0;
  const isLastStep = tutorialStep >= steps.length - 1;

  // Measure and update all geometry derived from real DOM elements
  const updateGeometry = useCallback(() => {
    if (!isTutorialActive) return;

    const vp: ViewportSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    setViewport(vp);

    // 1. Measure target rect
    const tRect = getTargetRect(currentStep.targetSelector);
    setTargetRect(tRect);

    // 2. Measure coachmark card and calculate placement
    const cardEl = cardRef.current;
    const cardWidth = cardEl ? cardEl.offsetWidth : 310;
    const cardHeight = cardEl ? cardEl.offsetHeight : 210;

    const computedPlacement = calculateCoachmarkPlacement(
      tRect,
      cardWidth,
      cardHeight,
      vp,
      currentStep.preferredPlacement
    );
    setPlacement(computedPlacement);

    // 3. Measure final card bounding rect and calculate SVG arrow geometry
    if (tRect && cardEl) {
      // Use the computed card boundaries to compute arrow anchors
      const virtualCardRect = new DOMRect(
        computedPlacement.left,
        computedPlacement.top,
        cardWidth,
        cardHeight
      );
      const arrow = calculateArrowGeometry(virtualCardRect, tRect);
      setArrowGeometry(arrow);
    } else {
      setArrowGeometry(null);
    }
  }, [isTutorialActive, currentStep.targetSelector, currentStep.preferredPlacement]);

  // Batch geometry measurement via requestAnimationFrame
  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      updateGeometry();
      rafIdRef.current = null;
    });
  }, [updateGeometry]);

  // Synchronize on step change, resize, and scroll
  useEffect(() => {
    if (!isTutorialActive) return;

    scheduleUpdate();

    const handleWindowResize = () => scheduleUpdate();
    const handleWindowScroll = () => scheduleUpdate();

    window.addEventListener('resize', handleWindowResize, { passive: true });
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    // Focus terminal input during command/drill steps for immediate interaction
    if (
      currentStep.id === 'bastion-terminal' ||
      currentStep.id === 'practice-get-nodes' ||
      currentStep.id === 'practice-run-pod'
    ) {
      const inputEl = document.querySelector<HTMLInputElement>(
        '[data-tutorial="terminal-input"] input'
      );
      if (inputEl) {
        inputEl.focus();
      }
    }

    // Set up ResizeObserver on coachmark card
    let cardObserver: ResizeObserver | null = null;
    if (cardRef.current && typeof ResizeObserver !== 'undefined') {
      cardObserver = new ResizeObserver(() => {
        scheduleUpdate();
      });
      cardObserver.observe(cardRef.current);
    }

    // Set up ResizeObserver on target element if present
    let targetObserver: ResizeObserver | null = null;
    if (currentStep.targetSelector && typeof ResizeObserver !== 'undefined') {
      const targetEl = document.querySelector(currentStep.targetSelector);
      if (targetEl) {
        targetObserver = new ResizeObserver(() => {
          scheduleUpdate();
        });
        targetObserver.observe(targetEl);
      }
    }

    const timer = setTimeout(scheduleUpdate, 60);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleWindowScroll);
      if (cardObserver) cardObserver.disconnect();
      if (targetObserver) targetObserver.disconnect();
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      clearTimeout(timer);
    };
  }, [isTutorialActive, tutorialStep, currentStep, scheduleUpdate]);

  // Auto-advance if cadet manually executed the required drill command in terminal
  useEffect(() => {
    if (!isTutorialActive || !lastCommand) return;

    const trimmed = lastCommand.trim().toLowerCase();
    if (currentStep.id === 'practice-get-nodes' && (trimmed === 'kubectl get nodes' || trimmed === 'oc get nodes')) {
      const timer = setTimeout(() => {
        actions.nextTutorialStep();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (
      currentStep.id === 'practice-run-pod' &&
      (trimmed.includes('kubectl run web-01') || trimmed.includes('oc run web-01'))
    ) {
      const timer = setTimeout(() => {
        actions.nextTutorialStep();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTutorialActive, lastCommand, currentStep.id, actions]);

  // ESC to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTutorialActive) return;
      if (e.key === 'Escape') {
        actions.skipTutorial();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTutorialActive, actions]);

  if (!isTutorialActive) return null;

  const handleAction = (cmd: string) => {
    actions.executeCommand(cmd);
    setTimeout(() => {
      actions.nextTutorialStep();
    }, 600);
  };

  const pad = TARGET_PADDING;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none select-none overflow-hidden">
      {/* 1. Viewport-level SVG Mask Layer & SVG Directional Arrow */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        <defs>
          {/* Spotlight hole mask */}
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - pad}
                y={targetRect.top - pad}
                width={targetRect.width + pad * 2}
                height={targetRect.height + pad * 2}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>

          {/* Precision Arrowhead Marker */}
          <marker
            id="tutorial-arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#6594FF" />
          </marker>

          {/* Arrow Neon Glow Filter */}
          <filter id="arrow-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#4F7CFF" floodOpacity="0.75" />
          </filter>
        </defs>

        {/* Backdrop dimmer: gentle dark translucency with transparent spotlight cutout */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 7, 17, 0.58)"
          mask="url(#tutorial-spotlight-mask)"
        />

        {/* Dynamic Connected SVG Arrow: from coachmark edge directly to target edge */}
        {arrowGeometry && (
          <g className="pointer-events-none">
            {/* Background halo stroke */}
            <path
              d={arrowGeometry.path}
              fill="none"
              stroke="#4F7CFF"
              strokeWidth="4"
              strokeOpacity="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#arrow-glow)"
            />
            {/* Foreground animated dashed line with arrowhead */}
            <path
              d={arrowGeometry.path}
              fill="none"
              stroke="#6594FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 3"
              markerEnd="url(#tutorial-arrowhead)"
              className="animate-pulse"
            />
          </g>
        )}
      </svg>

      {/* 2. Target Spotlight Luminous Border & Pulse Ripple */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-[105] transition-all duration-300"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
          }}
        >
          {/* Luminous Neon Edge */}
          <div className="w-full h-full rounded-xl border border-[#4F7CFF] shadow-[0_0_18px_rgba(79,124,255,0.45)]" />
          {/* Subtle Expanding Target Pulse Ripple */}
          <div className="absolute inset-0 rounded-xl animate-target-ripple pointer-events-none" />
        </div>
      )}

      {/* 3. Single Unified Coachmark Card (Fixed Coordinates, Zero Overflow) */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          top: `${placement.top}px`,
          left: `${placement.left}px`,
          boxSizing: 'border-box',
          width: 'clamp(280px, 24vw, 340px)',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
        }}
        className="pointer-events-auto z-[120] bg-[#0D1220]/96 border border-[rgba(119,101,248,0.4)] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.75),0_0_24px_rgba(119,101,248,0.2)] p-4 flex flex-col justify-between overflow-y-auto transition-all duration-300"
      >
        {/* Header: Category Badge, Step Progress & Skip Button */}
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(132,156,205,0.14)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-[#7765F8]/20 text-[#8B78FF] border border-[#7765F8]/35 shrink-0">
              {currentStep.badge}
            </span>
            <span className="text-[10px] font-mono text-[#7F8CA3] shrink-0">
              {String(currentStep.stepNumber).padStart(2, '0')} / {String(currentStep.totalSteps).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={actions.skipTutorial}
            className="flex items-center gap-1 text-[#7F8CA3] hover:text-[#F7F9FF] text-[11px] font-mono transition-colors cursor-pointer p-0.5 shrink-0"
            title="Skip Tutorial (Esc)"
          >
            <span>Skip</span>
            <X size={12} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-[#11182A] h-1 rounded-full mt-2 overflow-hidden shrink-0">
          <div
            className="h-full bg-gradient-to-r from-[#4F7CFF] via-[#7765F8] to-[#32D5D2] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep.stepNumber / currentStep.totalSteps) * 100}%` }}
          />
        </div>

        {/* Content: Title & Instruction */}
        <div className="mt-3 flex-1 min-w-0">
          <h2 className="text-sm font-bold text-[#F7F9FF] font-sans flex items-center gap-1.5 truncate">
            <Sparkles size={14} className="text-[#6594FF] shrink-0" />
            <span className="truncate">{currentStep.title}</span>
          </h2>
          <p className="text-xs text-[#C6CDDB] mt-1.5 leading-relaxed font-sans break-words">
            {currentStep.instruction}
          </p>
        </div>

        {/* Interactive Drill Action (Auto-Run button) */}
        {currentStep.interactiveAction && (
          <div className="mt-3 p-2 bg-[#080B17] rounded-xl border border-[#4F7CFF]/35 flex items-center justify-between gap-2 shrink-0">
            <code className="font-mono text-[11px] text-[#6594FF] truncate font-semibold min-w-0 flex-1">
              {currentStep.interactiveAction.command}
            </code>
            <button
              onClick={() => handleAction(currentStep.interactiveAction!.command)}
              className="px-2.5 py-1 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white text-[11px] font-mono font-semibold rounded-lg shadow-sm flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span>RUN</span>
              <CornerDownLeft size={10} />
            </button>
          </div>
        )}

        {/* Robust Footer: Contained Back & Next/Start Buttons */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(132,156,205,0.12)] shrink-0 gap-2.5 w-full">
          <button
            onClick={actions.prevTutorialStep}
            disabled={isFirstStep}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
              isFirstStep
                ? 'opacity-25 cursor-not-allowed text-[#7F8CA3]'
                : 'bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] border border-[rgba(132,156,205,0.16)] active:scale-95'
            }`}
          >
            <ArrowLeft size={12} />
            <span>Back</span>
          </button>

          {isLastStep ? (
            <button
              onClick={actions.finishTutorialAndStartLevel1}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#54D98C] via-[#32D5D2] to-[#4F7CFF] hover:filter hover:brightness-110 text-[#050711] font-mono font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>START LEVEL 1</span>
              <Play size={11} className="fill-[#050711]" />
            </button>
          ) : (
            <button
              onClick={actions.nextTutorialStep}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white font-mono font-semibold text-xs rounded-xl shadow-md flex items-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>Next</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
