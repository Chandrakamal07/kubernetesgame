import React from 'react';
import { useGameStore } from './state/useGameStore';
import { HomeScreen } from './components/screens/HomeScreen';
import { ChapterMapScreen } from './components/screens/ChapterMapScreen';
import { GameHUD } from './components/hud/GameHUD';
import { BattlefieldCanvas } from './components/battlefield/BattlefieldCanvas';
import { BastionTerminal } from './components/terminal/BastionTerminal';
import { KubernetesActivityPanel } from './components/learning/KubernetesActivityPanel';
import { ClusterEventsLog } from './components/learning/ClusterEventsLog';
import { HintModal } from './components/modals/HintModal';
import { LevelCompleteModal } from './components/modals/LevelCompleteModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { InteractiveTutorial } from './components/tutorial/InteractiveTutorial';

export const App: React.FC = () => {
  const { screen, isSidebarOpen } = useGameStore();

  if (screen === 'home') {
    return (
      <>
        <HomeScreen />
        <InteractiveTutorial />
      </>
    );
  }

  if (screen === 'chapter-map') {
    return (
      <>
        <ChapterMapScreen />
        <InteractiveTutorial />
      </>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#070B14] text-[#F8FAFC] overflow-hidden select-none font-sans">
      {/* Top Strategic HUD Strip */}
      <GameHUD />

      {/* Main Gameplay Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left/Center Main Column: Battlefield + Terminal */}
        <section className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Battlefield Area (HTML5 Canvas 2D) */}
          <div className="flex-1 relative min-h-[260px] overflow-hidden bg-[#070B14]">
            <BattlefieldCanvas />
          </div>

          {/* Bottom Kubernetes Simulation Terminal */}
          <div className="h-60 sm:h-72 min-h-[220px] max-h-[460px] shrink-0 border-t border-[rgba(148,163,184,0.14)]">
            <BastionTerminal />
          </div>
        </section>

        {/* Right Docked Sidebar: Mission Guidance, Tracer & Glossary */}
        {isSidebarOpen && (
          <aside className="w-full md:w-88 lg:w-96 border-t md:border-t-0 md:border-l border-[rgba(148,163,184,0.14)] flex flex-col bg-[#0E1625] overflow-y-auto shrink-0 z-10 transition-all duration-200">
            <KubernetesActivityPanel />
          </aside>
        )}
      </main>

      {/* Overlays & Modals */}
      <ClusterEventsLog />
      <HintModal />
      <LevelCompleteModal />
      <GameOverModal />
      <InteractiveTutorial />
    </div>
  );
};

export default App;
