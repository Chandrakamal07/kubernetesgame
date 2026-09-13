import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Play,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { allChapters } from '../../scenarios/chapter01';

export const ChapterMapScreen: React.FC = () => {
  const { completedMissionIds, mode, actions } = useGameStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const chapter1 = allChapters[0];
  const missions = chapter1.levels[0]?.missions || [];

  return (
    <div className="flex-1 flex flex-col p-6 bg-[#070B14] text-[#F8FAFC] overflow-y-auto">
      {/* Top Header */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between border-b border-[rgba(148,163,184,0.14)] pb-4 mb-6">
        <button
          onClick={() => actions.setScreen('home')}
          className="flex items-center gap-2 text-xs font-semibold text-[#6EA8FE] hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#151F31] text-[#B8C4D6]">
            Mode: {mode}
          </span>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="text-xs text-[#FB7185] hover:underline flex items-center gap-1 p-1"
            title="Reset Progress"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Main Chapter Journey */}
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <div>
          <span className="text-xs font-mono font-bold text-[#6EA8FE] uppercase tracking-wider">
            Curriculum Path
          </span>
          <h1 className="text-2xl font-bold text-[#F8FAFC]">
            Chapter 1: Nodes & Scheduling
          </h1>
          <p className="text-xs text-[#8190A7] mt-1">
            Master cluster anatomy, worker nodes, container images, allocatable compute, and kube-scheduler.
          </p>
        </div>

        {/* Vertical Lesson Cards */}
        <div className="space-y-3">
          {missions.map((mission) => {
            const isCompleted = completedMissionIds.has(mission.id);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-[#0E1625] border-[rgba(74,222,128,0.3)]'
                    : 'bg-[#0E1625] border-[rgba(148,163,184,0.14)] hover:border-[rgba(110,168,254,0.3)]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#6EA8FE]">
                      Lesson {mission.lessonNumber}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4ADE80] bg-[#4ADE80]/15 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">{mission.title}</h3>
                  <p className="text-xs text-[#8190A7]">{mission.teach.summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-[#FBBF24]">+{mission.basePoints} pts</span>
                    <span className="text-[10px] text-[#8190A7] block flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" /> ~2 mins
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      actions.startLevel(1, 1);
                    }}
                    className="btn-primary h-9 px-4 text-xs font-bold"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isCompleted ? 'Review' : 'Start'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Future Chapters (Marked as Coming Later) */}
        <div className="pt-4 space-y-3">
          <span className="text-xs font-mono font-bold text-[#8190A7] uppercase tracking-wider block">
            Future Chapters (Coming Later)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allChapters.slice(1).map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-xl bg-[#0E1625]/50 border border-[rgba(148,163,184,0.08)] space-y-2 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#8190A7]">{ch.title}</span>
                  <span className="text-[10px] text-[#8190A7] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Coming Later
                  </span>
                </div>
                <p className="text-[11px] text-[#8190A7]">{ch.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0E1625] border border-[rgba(251,113,133,0.3)] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#FB7185]">Reset All Learning Progress?</h3>
            <p className="text-xs text-[#B8C4D6] leading-relaxed">
              This will clear your completed lessons, streak, and scores stored in browser memory. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="btn-secondary text-xs h-9 px-3"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  actions.resetAllProgress();
                  setIsResetConfirmOpen(false);
                }}
                className="btn-primary text-xs h-9 px-4 bg-[#FB7185] hover:bg-[#FB7185]/90"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterMapScreen;
