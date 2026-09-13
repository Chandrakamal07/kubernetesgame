import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Shield,
  Play,
  Layers,
} from 'lucide-react';
import type { LearningMode } from '../../scenarios/types';

export const HomeScreen: React.FC = () => {
  const { mode, completedMissionIds, actions } = useGameStore();

  const hasProgress = completedMissionIds.size > 0;

  const handleStart = () => {
    actions.startLevel(1, 1);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#070B14] text-[#F8FAFC] overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Brand Shield & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0E1625] border border-[rgba(110,168,254,0.35)] shadow-2xl text-[#6EA8FE] mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F8FAFC]">
            Kubernetes Defense
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6EA8FE]">
            Learn Kubernetes by keeping a cluster running.
          </p>
          <p className="text-xs sm:text-sm text-[#8190A7] max-w-lg mx-auto leading-relaxed">
            No real cluster required. Commands run in a safe browser simulation. Designed for complete beginners with zero prior DevOps experience.
          </p>
        </div>

        {/* Visual Cluster Preview (Control Plane -> Worker Nodes -> Pods) */}
        <div className="bg-[#0E1625] p-4 rounded-2xl border border-[rgba(148,163,184,0.14)] shadow-xl space-y-3">
          <span className="text-[11px] font-mono font-bold text-[#8190A7] uppercase tracking-wider block">
            Simulated Cluster Architecture (v1.30.0)
          </span>
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="bg-[#151F31] p-3 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-1">
              <span className="text-xs font-mono font-bold text-[#6EA8FE]">1. Control Plane</span>
              <p className="text-[11px] text-[#B8C4D6]">API Server, etcd & Kube-Scheduler validate and place workloads.</p>
            </div>
            <div className="bg-[#151F31] p-3 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-1">
              <span className="text-xs font-mono font-bold text-[#5EEAD4]">2. Worker Nodes</span>
              <p className="text-[11px] text-[#B8C4D6]">worker-1, worker-2, worker-3 provide compute capacity.</p>
            </div>
            <div className="bg-[#151F31] p-3 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-1">
              <span className="text-xs font-mono font-bold text-[#4ADE80]">3. Active Workloads</span>
              <p className="text-[11px] text-[#B8C4D6]">Pods running nginx and redis handle traffic when Ready.</p>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-[#0E1625] p-3.5 rounded-2xl border border-[rgba(148,163,184,0.14)] space-y-2">
          <span className="text-xs font-semibold text-[#8190A7] block">Choose Learning Mode:</span>
          <div className="grid grid-cols-3 gap-2">
            {(['LEARN', 'PRACTICE', 'CHALLENGE'] as LearningMode[]).map((m) => (
              <button
                key={m}
                onClick={() => actions.setMode(m)}
                className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-[#151F31] border-[#6EA8FE] text-[#6EA8FE] shadow-md'
                    : 'bg-[#0E1625] border-[rgba(148,163,184,0.1)] text-[#8190A7] hover:text-[#F8FAFC]'
                }`}
              >
                <div className="font-bold">{m}</div>
                <div className="text-[10px] text-[#8190A7] font-normal mt-0.5">
                  {m === 'LEARN' ? 'Zero timer • Full guide' : m === 'PRACTICE' ? 'Hints • No penalties' : 'Timer • Multipliers'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary & Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStart}
            className="w-full sm:w-auto btn-primary h-12 px-8 text-sm font-bold shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{hasProgress ? 'Continue Learning' : 'Start Learning'}</span>
          </button>
          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="w-full sm:w-auto btn-secondary h-12 px-6 text-sm font-semibold"
          >
            <Layers className="w-4 h-4" />
            <span>Explore Lessons</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
