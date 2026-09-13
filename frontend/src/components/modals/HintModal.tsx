import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  HelpCircle,
  X,
  Terminal,
  Lock,
  Unlock,
} from 'lucide-react';

export const HintModal: React.FC = () => {
  const {
    isHintModalOpen,
    activeMission,
    currentHintTier,
    mode,
    actions,
  } = useGameStore();

  if (!isHintModalOpen || !activeMission) return null;

  const hints = activeMission.hints;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0E1625] border border-[rgba(148,163,184,0.14)] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(148,163,184,0.14)] pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FBBF24]" />
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Mission Hints</h3>
              <p className="text-xs text-[#8190A7]">
                {mode === 'LEARN' ? 'Learn Mode: No score penalties for unlocking hints.' : 'Progressive guidance tiers.'}
              </p>
            </div>
          </div>
          <button
            onClick={actions.closeHintModal}
            className="p-1 rounded-lg hover:bg-[#151F31] text-[#8190A7] hover:text-[#F8FAFC]"
            aria-label="Close Hint Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hint Tiers */}
        <div className="space-y-2.5">
          {hints.map((hintText, idx) => {
            const tierNum = idx + 1;
            const isUnlocked = currentHintTier >= tierNum;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-[#151F31] border-[rgba(110,168,254,0.3)]'
                    : 'bg-[#0E1625]/60 border-[rgba(148,163,184,0.1)] opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <Unlock className="w-4 h-4 text-[#4ADE80]" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#8190A7]" />
                    )}
                    <span className="text-xs font-mono font-bold text-[#6EA8FE]">
                      Tier {tierNum} Guidance
                    </span>
                  </div>
                </div>

                {isUnlocked ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-[#B8C4D6] leading-relaxed">{hintText}</p>
                    {tierNum === 4 && activeMission.guidedCommand && (
                      <button
                        onClick={() => {
                          actions.insertTerminalInput(activeMission.guidedCommand!.fullCommand);
                          actions.closeHintModal();
                        }}
                        className="btn-secondary text-[11px] h-8 px-3 text-[#5EEAD4] border-[#5EEAD4]/30 hover:bg-[#5EEAD4]/10"
                      >
                        <Terminal className="w-3.5 h-3.5" /> Insert Exact Command
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8190A7] mt-1">
                    Click &quot;Unlock Next Hint&quot; to reveal this tier.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[rgba(148,163,184,0.1)]">
          <button
            onClick={actions.closeHintModal}
            className="btn-secondary text-xs h-9 px-4"
          >
            Close
          </button>

          {currentHintTier < 4 && (
            <button
              onClick={actions.unlockNextHint}
              className="btn-primary text-xs h-9 px-4 font-bold bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-[#070B14]"
            >
              <Unlock className="w-3.5 h-3.5" /> Unlock Tier {currentHintTier + 1}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HintModal;
