import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { AlertTriangle, RotateCcw, Map } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { playState, score, actions } = useGameStore();

  if (playState !== 'GAME_OVER') return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-[#0E1625] border border-[rgba(251,113,133,0.4)] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#F8FAFC] text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FB7185]/15 border border-[#FB7185]/40 flex items-center justify-center mx-auto text-[#FB7185] shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-[#FB7185] uppercase tracking-wider">
            Challenge Terminated
          </span>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mt-1">
            Core Integrity Depleted
          </h2>
          <p className="text-xs text-[#8190A7] mt-1">
            In Challenge Mode, unhandled workloads breach cluster integrity. Review the concept and try again!
          </p>
        </div>

        <div className="bg-[#151F31] p-4 rounded-xl border border-[rgba(148,163,184,0.1)] space-y-2 text-left text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#8190A7]">Score Achieved:</span>
            <span className="font-mono font-bold text-[#FBBF24]">{score} pts</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="w-full btn-secondary text-xs h-10 font-semibold"
          >
            <Map className="w-4 h-4" /> Chapter Map
          </button>
          <button
            onClick={() => actions.startLevel(1, 1)}
            className="w-full btn-primary text-xs h-10 font-bold bg-[#FB7185] hover:bg-[#FB7185]/90"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
