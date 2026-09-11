import React from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Shield,
  Lightbulb,
  BookOpen,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Zap,
  ArrowLeft,
  Activity,
  FileText,
  GraduationCap,
} from 'lucide-react';

export const GameHUD: React.FC = () => {
  const {
    cluster,
    level,
    activeRequest,
    activeRequestIndex,
    isLearningViewOpen,
    isRequestPanelOpen,
    isEventsLogOpen,
    isPaused,
    isMuted,
    currentHintTier,
    isTutorialLevel,
    actions,
  } = useGameStore();

  const totalRequests = level.requests.length;
  const currentReqNum = activeRequestIndex + 1;
  const health = cluster.health;

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#080B17]/95 border-b border-[rgba(132,156,205,0.16)] text-[#F7F9FF] backdrop-blur-xl select-none z-20 transition-all">
      {/* Left: Branding & Chapter/Level Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => actions.setScreen('chapter-map')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] text-xs font-mono transition-all border border-[rgba(132,156,205,0.16)] hover:border-[#4F7CFF]/50 cursor-pointer active:scale-95"
          title="Return to Campaign Map"
        >
          <ArrowLeft size={13} />
          <span>MAP</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md bg-[#4F7CFF]/15 text-[#6594FF] border border-[#4F7CFF]/30 text-[10px] font-mono font-bold tracking-wider">
            K8S DEFENSE
          </span>
          <div className="hidden sm:block">
            <h1 className="text-xs font-semibold text-[#F7F9FF] tracking-wide truncate max-w-[220px] font-sans">
              {level.title}
            </h1>
            <p className="text-[10px] text-[#7F8CA3] font-mono">
              Objective {currentReqNum} of {totalRequests}
            </p>
          </div>
        </div>

        {/* Objective Toggle Pill */}
        {activeRequest && (
          <button
            onClick={actions.toggleRequestPanel}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer active:scale-95 ${
              isRequestPanelOpen
                ? 'bg-[#4F7CFF]/15 border-[#4F7CFF]/45 text-[#6594FF] shadow-sm shadow-[#4F7CFF]/15'
                : 'bg-[#11182A] hover:bg-[#1B2640] border-[rgba(132,156,205,0.16)] text-[#C6CDDB]'
            }`}
            title="Toggle Active Request Details"
          >
            <FileText size={12} className="text-[#4F7CFF]" />
            <span className="truncate max-w-[180px]">
              {activeRequest.requirements.type === 'create-pod'
                ? `Pod: ${activeRequest.requirements.podName}`
                : activeRequest.title}
            </span>
          </button>
        )}
      </div>

      {/* Middle: Cluster Health, SLA Streak, XP Score */}
      <div className="flex items-center gap-4">
        {/* Cluster Health Meter */}
        <div data-tutorial="hud-health" className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#0D1220]/60 border border-transparent transition-all">
          <Shield
            size={14}
            className={health > 50 ? 'text-[#54D98C]' : health > 25 ? 'text-[#F2B95F]' : 'text-[#F06D78]'}
          />
          <div className="w-20 sm:w-28 bg-[#11182A] rounded-full h-2 overflow-hidden border border-[rgba(132,156,205,0.2)]">
            <div
              className={`h-full transition-all duration-400 rounded-full ${
                health > 50
                  ? 'bg-gradient-to-r from-[#32D5D2] to-[#54D98C]'
                  : health > 25
                  ? 'bg-gradient-to-r from-[#F2B95F] to-[#E58C42]'
                  : 'bg-gradient-to-r from-[#F06D78] to-[#D9383A]'
              }`}
              style={{ width: `${health}%` }}
            />
          </div>
          <span className="text-xs font-mono font-semibold text-[#F7F9FF]">{health}%</span>
        </div>

        {/* SLA Streak Multiplier Badge */}
        {cluster.slaStreak > 1 && (
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#32D5D2]/15 border border-[#32D5D2]/35 text-[#32D5D2] text-[11px] font-mono font-bold animate-pulse">
            <Zap size={11} className="fill-[#32D5D2]" />
            <span>SLA x{cluster.slaStreak}</span>
          </div>
        )}

        {/* XP Progression Score */}
        <div data-tutorial="hud-xp" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#11182A] border border-[rgba(132,156,205,0.16)]">
          <span className="text-[10px] text-[#7F8CA3] font-mono">XP</span>
          <span className="text-xs font-mono font-bold text-[#F1C66C]">{cluster.score.toLocaleString()}</span>
        </div>
      </div>

      {/* Right: Operational Controls */}
      <div className="flex items-center gap-1.5">
        {/* Tutorial Launch Button */}
        <button
          onClick={actions.startTutorial}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all border cursor-pointer active:scale-95 ${
            isTutorialLevel
              ? 'bg-[#7765F8]/20 border-[#7765F8]/45 text-[#8B78FF]'
              : 'bg-[#11182A] hover:bg-[#1B2640] border-[rgba(132,156,205,0.16)] text-[#C6CDDB] hover:text-[#F7F9FF] hover:border-[#4F7CFF]/40'
          }`}
          title="Open Step-by-Step Interactive Guide"
        >
          <GraduationCap size={13} className="text-[#4F7CFF]" />
          <span className="hidden sm:inline">TUTORIAL</span>
        </button>

        {/* Hint button */}
        <button
          data-tutorial="hud-hint"
          onClick={actions.openHintModal}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F2B95F]/12 hover:bg-[#F2B95F]/20 border border-[#F2B95F]/35 text-[#F2B95F] text-xs font-mono font-medium transition-all cursor-pointer active:scale-95"
          title="Open progressive technical hints"
        >
          <Lightbulb size={13} className="fill-[#F2B95F]/20" />
          <span>HINT</span>
          {currentHintTier > 0 && (
            <span className="w-3.5 h-3.5 rounded-full bg-[#F2B95F] text-[#050711] text-[9px] font-bold flex items-center justify-center">
              {currentHintTier}
            </span>
          )}
        </button>

        {/* Learning View Toggle */}
        <button
          data-tutorial="hud-learning"
          onClick={actions.toggleLearningView}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all border cursor-pointer active:scale-95 ${
            isLearningViewOpen
              ? 'bg-[#4F7CFF]/15 border-[#4F7CFF]/45 text-[#6594FF] shadow-sm shadow-[#4F7CFF]/15'
              : 'bg-[#11182A] hover:bg-[#1B2640] border-[rgba(132,156,205,0.16)] text-[#C6CDDB]'
          }`}
          title="Toggle Control-Plane Step-by-Step Learning View"
        >
          <BookOpen size={12} />
          <span className="hidden sm:inline">TRACE</span>
        </button>

        {/* Cluster Events Toggle */}
        <button
          onClick={actions.toggleEventsLog}
          className={`p-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer active:scale-95 ${
            isEventsLogOpen
              ? 'bg-[#7765F8]/20 border-[#7765F8]/45 text-[#8B78FF]'
              : 'bg-[#11182A] hover:bg-[#1B2640] border-[rgba(132,156,205,0.16)] text-[#C6CDDB]'
          }`}
          title="Toggle Cluster Audit Events Log"
        >
          <Activity size={13} />
        </button>

        {/* Pause Button */}
        <button
          onClick={actions.togglePause}
          className="p-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] border border-[rgba(132,156,205,0.16)] text-xs transition-all cursor-pointer active:scale-95"
          title={isPaused ? 'Resume simulation' : 'Pause simulation'}
        >
          {isPaused ? <Play size={13} className="text-[#54D98C] fill-[#54D98C]" /> : <Pause size={13} />}
        </button>

        {/* Mute/Audio Button */}
        <button
          onClick={actions.toggleMute}
          className="p-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F7F9FF] border border-[rgba(132,156,205,0.16)] text-xs transition-all cursor-pointer active:scale-95"
          title={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {isMuted ? <VolumeX size={13} className="text-[#F06D78]" /> : <Volume2 size={13} className="text-[#32D5D2]" />}
        </button>

        {/* Restart Level */}
        <button
          onClick={() => actions.startLevel(level.chapterId, level.id)}
          className="p-1.5 rounded-lg bg-[#11182A] hover:bg-[#1B2640] text-[#C6CDDB] hover:text-[#F06D78] border border-[rgba(132,156,205,0.16)] text-xs transition-all cursor-pointer active:scale-95"
          title="Restart current level"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </header>
  );
};
