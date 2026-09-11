import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Lightbulb, X, Lock, Unlock, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

export const HintModal: React.FC = () => {
  const { isHintModalOpen, activeRequest, currentHintTier, actions } = useGameStore();

  if (!isHintModalOpen || !activeRequest) return null;

  const hintLabels = [
    { title: 'Level 1: Architectural Concept', penalty: '0 XP deduction' },
    { title: 'Level 2: Kubernetes CLI Tool', penalty: '-5 XP deduction' },
    { title: 'Level 3: Required Flags & Syntax', penalty: '-10 XP deduction' },
    { title: 'Level 4: Full Executable Command', penalty: '-20 XP deduction' },
  ];

  return (
    <div className="fixed inset-0 bg-[#050711]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1220] border border-[#F2B95F]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(242,185,95,0.15)] p-5 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(132,156,205,0.16)]">
          <div className="flex items-center gap-2 text-[#F2B95F] font-mono font-bold text-sm">
            <Lightbulb size={17} className="fill-[#F2B95F]/20" />
            <span>PROGRESSIVE TECHNICAL HINTS</span>
          </div>
          <button
            onClick={actions.closeHintModal}
            className="p-1 text-[#7F8CA3] hover:text-[#F7F9FF] rounded-lg hover:bg-[#151E33] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Objective Context */}
        <div className="mt-3 p-3 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
          <div className="text-[10px] font-mono text-[#4F7CFF] uppercase font-bold">Active Objective</div>
          <div className="text-xs font-semibold text-[#F7F9FF] mt-0.5 font-sans">{activeRequest.title}</div>
          <div className="text-[11px] text-[#7F8CA3] mt-1 font-sans">{activeRequest.description}</div>
        </div>

        {/* Progressive Hint Tiers */}
        <div className="mt-4 space-y-2.5">
          {activeRequest.hints.map((hintText, idx) => {
            const tierNum = idx + 1;
            const isUnlocked = currentHintTier >= tierNum;
            const meta = hintLabels[idx];

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-[#151E33]/90 border-[#F2B95F]/45 shadow-sm'
                    : 'bg-[#080B17]/60 border-[rgba(132,156,205,0.1)] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-semibold">
                    {isUnlocked ? (
                      <Unlock size={13} className="text-[#F2B95F]" />
                    ) : (
                      <Lock size={13} className="text-[#7F8CA3]" />
                    )}
                    <span className={isUnlocked ? 'text-[#F2B95F]' : 'text-[#7F8CA3]'}>{meta.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7F8CA3]">{meta.penalty}</span>
                </div>

                {isUnlocked ? (
                  <div className="mt-2 text-xs text-[#F7F9FF] font-mono bg-[#080B17] p-2.5 rounded-lg border border-[rgba(132,156,205,0.16)] flex items-center justify-between">
                    <span className="text-[#54D98C] font-semibold">{hintText}</span>
                    {tierNum === 4 && (
                      <button
                        onClick={() => {
                          actions.executeCommand(hintText.replace('Execute: ', '').trim());
                          actions.closeHintModal();
                        }}
                        className="ml-2 px-2.5 py-1 bg-[#4F7CFF] hover:bg-[#6594FF] text-white rounded text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        title="Execute in terminal"
                      >
                        <span>RUN</span>
                        <CornerDownLeft size={10} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-[#7F8CA3] italic font-sans">Locked (Click Reveal below to unlock)</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button: Reveal Next Hint */}
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-[rgba(132,156,205,0.16)]">
          <button
            onClick={actions.closeHintModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono transition-colors border border-[rgba(132,156,205,0.16)] cursor-pointer"
          >
            Close
          </button>

          {currentHintTier < 4 ? (
            <button
              onClick={actions.unlockNextHint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F2B95F] to-[#E58C42] hover:filter hover:brightness-110 text-[#050711] font-mono font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#F2B95F]/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>REVEAL HINT {currentHintTier + 1}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <span className="text-xs font-mono text-[#54D98C] font-semibold flex items-center gap-1">
              <Sparkles size={13} />
              All hints unlocked
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
