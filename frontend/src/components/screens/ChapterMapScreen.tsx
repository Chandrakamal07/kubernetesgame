import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import { allChapters, tutorialLevel } from '../../scenarios/chapter01';
import { ArrowLeft, Lock, Play, Shield, GraduationCap, Sparkles } from 'lucide-react';

export const ChapterMapScreen: React.FC = () => {
  const { actions, cluster } = useGameStore();

  return (
    <div className="min-h-screen bg-[#050711] text-[#F7F9FF] p-6 flex flex-col justify-between select-none">
      {/* Top Map Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-[rgba(132,156,205,0.16)]">
        <button
          onClick={() => actions.setScreen('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono transition-all border border-[rgba(132,156,205,0.16)] cursor-pointer active:scale-95"
        >
          <ArrowLeft size={15} />
          <span>HOME</span>
        </button>

        <div className="flex items-center gap-2">
          <Shield size={17} className="text-[#4F7CFF]" />
          <span className="font-mono font-bold text-sm tracking-wider text-[#F7F9FF]">KUBERNETES CAMPAIGN MAP</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#7F8CA3] bg-[#11182A] px-3 py-1 rounded-lg border border-[rgba(132,156,205,0.16)]">
          <span>XP:</span>
          <span className="text-[#F1C66C] font-bold flex items-center gap-1">
            <Sparkles size={11} />
            {cluster.score.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Campaign List */}
      <main className="max-w-5xl w-full mx-auto my-8 flex-1">
        {/* Academy Tutorial Card */}
        <div className="p-6 rounded-2xl border bg-[#11182A]/95 border-[#4F7CFF]/45 shadow-xl mb-6 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-[#4F7CFF]/15 text-[#6594FF] border border-[#4F7CFF]/35 flex items-center gap-1">
                  <GraduationCap size={12} />
                  <span>ONBOARDING</span>
                </span>
                <h2 className="text-lg font-bold text-[#F7F9FF] font-mono">{tutorialLevel.title}</h2>
              </div>
              <p className="text-xs text-[#C6CDDB] mt-1.5 font-sans leading-relaxed">{tutorialLevel.description}</p>
            </div>

            <button
              onClick={actions.startTutorial}
              className="px-5 py-2.5 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white font-mono font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#4F7CFF]/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Play size={13} className="fill-white" />
              <span>START GUIDED TUTORIAL</span>
            </button>
          </div>
        </div>

        {/* Campaign Chapters */}
        <div className="space-y-6">
          {allChapters.map((chap) => (
            <div
              key={chap.id}
              className={`p-6 rounded-2xl border transition-all ${
                chap.unlocked
                  ? 'bg-[#11182A]/90 border-[#4F7CFF]/40 shadow-xl backdrop-blur-xl'
                  : 'bg-[#080B17]/50 border-[rgba(132,156,205,0.1)] opacity-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                        chap.unlocked
                          ? 'bg-[#4F7CFF]/15 text-[#6594FF] border border-[#4F7CFF]/35'
                          : 'bg-[#0D1220] text-[#7F8CA3] border border-[rgba(132,156,205,0.16)]'
                      }`}
                    >
                      {chap.badge}
                    </span>
                    <h2 className="text-lg font-bold text-[#F7F9FF] font-sans">{chap.title}</h2>
                  </div>
                  <p className="text-xs text-[#C6CDDB] mt-1 font-sans">{chap.description}</p>
                </div>

                {!chap.unlocked && (
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#7F8CA3]">
                    <Lock size={14} />
                    <span>Locked</span>
                  </div>
                )}
              </div>

              {chap.unlocked && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-[rgba(132,156,205,0.16)]">
                  {chap.levels.map((lvl) => (
                    <div
                      key={lvl.id}
                      className="p-4 bg-[#0D1220] rounded-xl border border-[rgba(132,156,205,0.16)] hover:border-[#4F7CFF]/50 flex items-center justify-between group transition-all shadow-md"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#F7F9FF] font-sans group-hover:text-[#6594FF] transition-colors">
                          {lvl.title}
                        </div>
                        <div className="text-[11px] text-[#C6CDDB] mt-0.5 font-sans">{lvl.subtitle}</div>
                        <div className="text-[10px] text-[#7F8CA3] font-mono mt-1">
                          {lvl.requests.length} Objectives • Defense Lane Ingress
                        </div>
                      </div>

                      <button
                        onClick={() => actions.startLevel(chap.id, lvl.id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#4F7CFF] to-[#7765F8] hover:from-[#6594FF] hover:to-[#8B78FF] text-white font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-[#4F7CFF]/25 transition-all group-hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
                      >
                        <Play size={12} className="fill-white" />
                        <span>PLAY</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto pt-4 border-t border-[rgba(132,156,205,0.16)] text-center text-xs text-[#7F8CA3] font-mono">
        Kubernetes Defense Campaign System • Chapter 1 Active
      </footer>
    </div>
  );
};
