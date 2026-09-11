import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { AlertOctagon, RotateCcw, Layers } from 'lucide-react';

export const GameOverModal: React.FC = () => {
  const { playState, level, actions } = useGameStore();

  if (playState !== 'GAME_OVER') return null;

  return (
    <div className="fixed inset-0 bg-[#050711]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-[#0D1220] border border-[#F06D78]/45 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(240,109,120,0.18)] p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#F06D78]/15 border border-[#F06D78]/35 flex items-center justify-center mx-auto text-[#F06D78] mb-3 shadow-lg shadow-[#F06D78]/20">
          <AlertOctagon size={28} />
        </div>

        <span className="px-3 py-0.5 rounded-full bg-[#F06D78]/15 text-[#F06D78] font-mono font-bold text-xs border border-[#F06D78]/35 uppercase tracking-wider">
          CLUSTER CORE OFFLINE
        </span>
        <h2 className="text-xl font-bold text-[#F7F9FF] mt-2 font-sans">SLA Breached — Cluster Overrun</h2>
        <p className="text-xs text-[#C6CDDB] mt-2 leading-relaxed font-sans">
          Customer requests reached worker nodes before container workloads were scheduled and initialized.
        </p>

        <div className="mt-4 p-3 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)] text-left font-mono text-xs text-[#C6CDDB] space-y-1.5">
          <div className="text-[10px] text-[#F2B95F] font-bold uppercase">Incident Post-Mortem:</div>
          <div>• Ensure pods are created with matching names and images.</div>
          <div>• Use <span className="text-[#6594FF] font-semibold">kubectl get nodes</span> to verify node status.</div>
          <div>• Use <span className="text-[#F2B95F] font-semibold">HINT</span> if you need syntax clarification!</div>
        </div>

        <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-[rgba(132,156,205,0.16)]">
          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="px-4 py-2 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 border border-[rgba(132,156,205,0.16)] cursor-pointer"
          >
            <Layers size={13} />
            <span>CHAPTER MAP</span>
          </button>
          <button
            onClick={() => actions.startLevel(level.chapterId, level.id)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D9383A] to-[#F06D78] hover:filter hover:brightness-110 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-[#F06D78]/25 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>RETRY MISSION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
