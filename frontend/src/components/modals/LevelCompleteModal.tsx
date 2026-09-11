import React, { useEffect } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { Trophy, Star, CheckCircle, RotateCcw, ArrowRight, BookOpen, Layers, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LevelCompleteModal: React.FC = () => {
  const { playState, cluster, level, commandsExecutedCount, isTutorialLevel, actions } = useGameStore();

  useEffect(() => {
    if (playState === 'LEVEL_COMPLETE') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F7CFF', '#7765F8', '#32D5D2', '#54D98C', '#F1C66C'],
      });
    }
  }, [playState]);

  if (playState !== 'LEVEL_COMPLETE') return null;

  const stars = cluster.health >= 80 && cluster.hintsUsedCount <= 3 ? 3 : cluster.health >= 50 ? 2 : 1;

  return (
    <div className="fixed inset-0 bg-[#050711]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-xl bg-[#0D1220] border border-[#54D98C]/45 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(84,217,140,0.18)] p-6 overflow-hidden">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-[#54D98C]/15 border border-[#54D98C]/35 flex items-center justify-center mx-auto text-[#54D98C] mb-3 shadow-lg shadow-[#54D98C]/20">
            <Trophy size={26} />
          </div>

          <span className="px-3 py-0.5 rounded-full bg-[#54D98C]/15 text-[#54D98C] font-mono font-bold text-xs border border-[#54D98C]/35 uppercase tracking-wider">
            {isTutorialLevel ? 'ACADEMY CERTIFICATION COMPLETE' : 'MISSION ACCOMPLISHED'}
          </span>
          <h2 className="text-2xl font-bold text-[#F7F9FF] mt-2 font-sans">{level.title}</h2>
          <p className="text-xs text-[#C6CDDB] font-sans">{level.subtitle}</p>

          {/* Star Achievements */}
          <div className="flex justify-center gap-2.5 mt-3.5">
            {[1, 2, 3].map((starIdx) => (
              <Star
                key={starIdx}
                size={22}
                className={
                  starIdx <= stars
                    ? 'text-[#F1C66C] fill-[#F1C66C] drop-shadow-[0_0_8px_rgba(241,198,108,0.6)]'
                    : 'text-[#1B2640]'
                }
              />
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 font-mono text-center">
          <div className="p-2.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <div className="text-[10px] text-[#7F8CA3] uppercase">Objectives</div>
            <div className="text-sm font-bold text-[#54D98C] mt-0.5">
              {cluster.requestsCompleted}/{level.requests.length}
            </div>
          </div>
          <div className="p-2.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <div className="text-[10px] text-[#7F8CA3] uppercase">Cluster Health</div>
            <div className="text-sm font-bold text-[#32D5D2] mt-0.5">{cluster.health}%</div>
          </div>
          <div className="p-2.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <div className="text-[10px] text-[#7F8CA3] uppercase">Commands</div>
            <div className="text-sm font-bold text-[#F7F9FF] mt-0.5">{commandsExecutedCount}</div>
          </div>
          <div className="p-2.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
            <div className="text-[10px] text-[#7F8CA3] uppercase">XP Awarded</div>
            <div className="text-sm font-bold text-[#F1C66C] mt-0.5">{cluster.score.toLocaleString()}</div>
          </div>
        </div>

        {/* Learning Outcomes Checklist */}
        <div className="mt-5 p-3.5 bg-[#080B17] rounded-xl border border-[rgba(132,156,205,0.16)]">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#4F7CFF] uppercase tracking-wider mb-2.5">
            <BookOpen size={13} />
            <span>KNOWLEDGE OUTCOMES VERIFIED</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[#C6CDDB] font-sans">
            {level.learningOutcomes.map((outcome, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-[#54D98C] shrink-0 mt-0.5" />
                <span className="leading-snug">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[rgba(132,156,205,0.16)]">
          <button
            onClick={() => actions.setScreen('chapter-map')}
            className="px-4 py-2 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-[rgba(132,156,205,0.16)]"
          >
            <Layers size={13} />
            <span>CHAPTER MAP</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => actions.startLevel(level.chapterId, level.id)}
              className="px-4 py-2 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-[rgba(132,156,205,0.16)]"
            >
              <RotateCcw size={13} />
              <span>REPLAY</span>
            </button>

            {isTutorialLevel ? (
              <button
                onClick={() => actions.startLevel(1, 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#54D98C] via-[#32D5D2] to-[#4F7CFF] hover:filter hover:brightness-110 text-[#050711] text-xs font-mono font-bold transition-all shadow-lg shadow-[#54D98C]/30 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-xl"
              >
                <span>START LEVEL 1</span>
                <Play size={13} className="fill-[#050711]" />
              </button>
            ) : (
              <button
                onClick={() => actions.setScreen('chapter-map')}
                className="px-5 py-2.5 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white text-xs font-mono font-bold transition-all shadow-lg shadow-[#4F7CFF]/30 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer rounded-xl"
              >
                <span>NEXT LEVEL</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
