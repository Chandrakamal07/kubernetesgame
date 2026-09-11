import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Lightbulb, X, Lock, CheckCircle2, ArrowRight, CornerDownLeft, Sparkles, Terminal } from 'lucide-react';

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
    <div className="fixed inset-0 bg-[#03060F]/65 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1220]/95 border border-[#F2B95F]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(242,185,95,0.15)] p-5 overflow-hidden backdrop-blur-xl">
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

        {/* Progressive Hint Tiers - Accordion Style */}
        <div className="mt-4 space-y-2">
          {activeRequest.hints.map((hintText, idx) => {
            const tierNum = idx + 1;
            const isLatestUnlocked = currentHintTier === tierNum;
            const isPreviousUnlocked = currentHintTier > tierNum;
            const meta = hintLabels[idx];

            if (isPreviousUnlocked) {
              // Compact summary row for previously unlocked hints
              return (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-[#0E1526]/80 border border-[rgba(132,156,205,0.14)] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-mono text-[#54D98C]">
                    <CheckCircle2 size={13} className="text-[#54D98C] shrink-0" />
                    <span className="font-semibold text-[11px]">{meta.title}</span>
                  </div>
                  <span className="text-[11px] text-[#C6CDDB] font-mono truncate max-w-[200px]">{hintText}</span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isLatestUnlocked
                    ? 'bg-[#151E33] border-[#F2B95F]/50 shadow-md shadow-[#F2B95F]/10'
                    : 'bg-[#080B17]/60 border-[rgba(132,156,205,0.1)] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-semibold">
                    {isLatestUnlocked ? (
                      <Lightbulb size={14} className="text-[#F2B95F]" />
                    ) : (
                      <Lock size={13} className="text-[#7F8CA3]" />
                    )}
                    <span className={isLatestUnlocked ? 'text-[#F2B95F]' : 'text-[#7F8CA3]'}>{meta.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7F8CA3]">{meta.penalty}</span>
                </div>

                {isLatestUnlocked ? (
                  <div className="mt-2.5 text-xs text-[#F7F9FF] font-mono bg-[#080B17] p-2.5 rounded-lg border border-[rgba(132,156,205,0.16)] flex items-center justify-between gap-2">
                    <span className="text-[#54D98C] font-semibold leading-relaxed break-all">{hintText}</span>
                    {tierNum === 4 && (
                      <button
                        onClick={() => {
                          const cmd = hintText.replace('Execute: ', '').trim();
                          actions.insertTerminalInput(cmd);
                          actions.closeHintModal();
                        }}
                        className="px-2.5 py-1.5 bg-[#4F7CFF] hover:bg-[#6594FF] text-white rounded-lg text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-[#4F7CFF]/30"
                        title="Insert command into terminal input without running"
                      >
                        <Terminal size={11} />
                        <span>INSERT COMMAND</span>
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
