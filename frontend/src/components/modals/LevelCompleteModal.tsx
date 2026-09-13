import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Award,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LevelCompleteModal: React.FC = () => {
  const { playState, score, successStreak, level, actions } = useGameStore();

  React.useEffect(() => {
    if (playState === 'LEVEL_COMPLETE') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [playState]);

  if (playState !== 'LEVEL_COMPLETE') return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#0E1625] border border-[rgba(74,222,128,0.4)] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#F8FAFC] text-center">
        {/* Celebration Trophy Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#4ADE80]/15 border border-[#4ADE80]/40 flex items-center justify-center mx-auto text-[#4ADE80] shadow-lg">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-[#4ADE80] uppercase tracking-wider">
            Chapter Complete!
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            {level.title}
          </h2>
          <p className="text-xs text-[#8190A7] mt-1">
            You have mastered nodes, allocatable resources, declarative apply, and scheduling diagnosis!
          </p>
        </div>

        {/* Score & Outcomes Card */}
        <div className="bg-[#151F31] p-4 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-3 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(148,163,184,0.1)]">
            <span className="text-xs text-[#8190A7]">Total Score:</span>
            <span className="font-mono font-bold text-[#FBBF24] text-sm">+{score} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8190A7]">Final Streak:</span>
            <span className="font-mono font-bold text-[#5EEAD4] text-sm">{successStreak}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="w-full btn-secondary text-xs h-10 font-semibold"
          >
            Chapter Map
          </button>
          <button
            onClick={() => actions.startLevel(1, 1)}
            className="w-full btn-primary text-xs h-10 font-bold bg-gradient-to-r from-[#4ADE80] to-[#5EEAD4] text-[#070B14]"
          >
            Play Again <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelCompleteModal;
