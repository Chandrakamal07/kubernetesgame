import React, { useState } from 'react';
import { useGameStore } from '../../state/useGameStore';
import {
  Shield,
  Award,
  Zap,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Map,
  HelpCircle,
  Activity,
  Menu,
  X,
} from 'lucide-react';

export const GameHUD: React.FC = () => {
  const {
    mode,
    score,
    successStreak,
    coreIntegrity,
    level,
    activeMission,
    activeMissionIndex,
    isPaused,
    isMuted,
    activeSidebarTab,
    isSidebarOpen,
    actions,
  } = useGameStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalMissions = level.missions.length;
  const currentNum = activeMissionIndex + 1;

  return (
    <header className="h-14 bg-[#0E1625] border-b border-[rgba(148,163,184,0.14)] px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Left: Branding & Chapter/Lesson Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => actions.setScreen('chapter-map')}
          className="flex items-center gap-2 text-[#6EA8FE] hover:text-[#F8FAFC] transition-colors p-1.5 rounded-lg hover:bg-[#151F31]"
          title="Back to Chapter Map"
          aria-label="Back to Chapter Map"
        >
          <div className="w-8 h-8 rounded-lg bg-[#151F31] border border-[rgba(110,168,254,0.3)] flex items-center justify-center text-[#6EA8FE]">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm hidden sm:inline tracking-wide text-[#F8FAFC]">
            KUBERNETES DEFENSE
          </span>
        </button>

        <div className="h-4 w-px bg-[rgba(148,163,184,0.2)] hidden sm:block" />

        {/* Current Lesson Badge */}
        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#151F31] text-[#6EA8FE] border border-[rgba(110,168,254,0.2)]">
            {currentNum}/{totalMissions}
          </span>
          <span className="text-xs sm:text-sm font-medium text-[#B8C4D6] truncate max-w-[200px] md:max-w-xs">
            {activeMission?.title || level.title}
          </span>
        </div>
      </div>

      {/* Center: Mode Badge & Core Integrity */}
      <div className="hidden md:flex items-center gap-4">
        {/* Mode Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#151F31] border border-[rgba(148,163,184,0.2)]">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          <span className="text-xs font-mono font-semibold text-[#F8FAFC]">
            {mode} MODE
          </span>
        </div>

        {/* Core Integrity (Fictional Shield) */}
        <div className="flex items-center gap-2 bg-[#151F31] px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.14)]" title="Fictional Core Integrity Shield">
          <Shield className="w-3.5 h-3.5 text-[#5EEAD4]" />
          <span className="text-xs text-[#8190A7] font-medium">Core Integrity:</span>
          <div className="w-16 h-2 bg-[#070B14] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                coreIntegrity > 50 ? 'bg-[#4ADE80]' : coreIntegrity > 25 ? 'bg-[#FBBF24]' : 'bg-[#FB7185]'
              }`}
              style={{ width: `${coreIntegrity}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-[#F8FAFC]">{coreIntegrity}%</span>
        </div>

        {/* Points & Streak */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#FBBF24]" title="Total Points Earned">
            <Award className="w-4 h-4" />
            <span className="font-mono text-xs font-bold text-[#F8FAFC]">{score}</span>
          </div>
          {successStreak > 0 && (
            <div className="flex items-center gap-1 text-[#5EEAD4]" title="Success Streak">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono text-xs font-bold text-[#F8FAFC]">{successStreak}x</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5">
        {/* Sidebar Tab Toggles */}
        <div className="hidden sm:flex items-center bg-[#151F31] p-0.5 rounded-lg border border-[rgba(148,163,184,0.14)]">
          <button
            onClick={() => actions.setActiveSidebarTab('mission')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isSidebarOpen && activeSidebarTab === 'mission'
                ? 'bg-[#6EA8FE] text-[#070B14] font-semibold'
                : 'text-[#B8C4D6] hover:text-[#F8FAFC]'
            }`}
          >
            Mission
          </button>
          <button
            onClick={() => actions.setActiveSidebarTab('tracer')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isSidebarOpen && activeSidebarTab === 'tracer'
                ? 'bg-[#6EA8FE] text-[#070B14] font-semibold'
                : 'text-[#B8C4D6] hover:text-[#F8FAFC]'
            }`}
          >
            K8s Tracer
          </button>
          <button
            onClick={() => actions.setActiveSidebarTab('glossary')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isSidebarOpen && activeSidebarTab === 'glossary'
                ? 'bg-[#6EA8FE] text-[#070B14] font-semibold'
                : 'text-[#B8C4D6] hover:text-[#F8FAFC]'
            }`}
          >
            Glossary
          </button>
        </div>

        {/* Pause Button */}
        <button
          onClick={actions.togglePause}
          className={`p-2 rounded-lg border transition-colors ${
            isPaused
              ? 'bg-[#FBBF24]/20 border-[#FBBF24] text-[#FBBF24]'
              : 'bg-[#151F31] border-[rgba(148,163,184,0.14)] text-[#B8C4D6] hover:text-[#F8FAFC]'
          }`}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          aria-label={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Hint Button */}
        <button
          onClick={actions.openHintModal}
          className="p-2 rounded-lg bg-[#151F31] border border-[rgba(148,163,184,0.14)] text-[#FBBF24] hover:bg-[#1C2940] transition-colors"
          title="Open Hints & Guidance"
          aria-label="Open Hints & Guidance"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={actions.toggleMute}
          className="p-2 rounded-lg bg-[#151F31] border border-[rgba(148,163,184,0.14)] text-[#B8C4D6] hover:text-[#F8FAFC] transition-colors hidden sm:block"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Events Log Toggle */}
        <button
          onClick={actions.toggleEventsLog}
          className="p-2 rounded-lg bg-[#151F31] border border-[rgba(148,163,184,0.14)] text-[#B8C4D6] hover:text-[#F8FAFC] transition-colors"
          title="Open Cluster Event Log"
          aria-label="Open Cluster Event Log"
        >
          <Activity className="w-4 h-4" />
        </button>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-[#151F31] border border-[rgba(148,163,184,0.14)] text-[#B8C4D6] hover:text-[#F8FAFC] sm:hidden"
          aria-label="Open Mobile Menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[#0E1625] border-b border-[rgba(148,163,184,0.2)] p-4 flex flex-col gap-3 sm:hidden z-30 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(148,163,184,0.1)]">
            <span className="text-xs text-[#8190A7]">Mode: {mode}</span>
            <span className="text-xs text-[#FBBF24] font-bold">Points: {score}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                actions.setActiveSidebarTab('mission');
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-[#151F31] text-xs text-center text-[#F8FAFC]"
            >
              Mission
            </button>
            <button
              onClick={() => {
                actions.setActiveSidebarTab('tracer');
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-[#151F31] text-xs text-center text-[#F8FAFC]"
            >
              K8s Tracer
            </button>
            <button
              onClick={() => {
                actions.setActiveSidebarTab('glossary');
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded bg-[#151F31] text-xs text-center text-[#F8FAFC]"
            >
              Glossary
            </button>
          </div>
          <button
            onClick={() => {
              actions.setScreen('chapter-map');
              setIsMobileMenuOpen(false);
            }}
            className="w-full btn-secondary text-xs h-9"
          >
            <Map className="w-3.5 h-3.5" /> Chapter Map
          </button>
        </div>
      )}
    </header>
  );
};
