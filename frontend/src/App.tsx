import React from 'react';
import { useGameStore } from './state/useGameStore';
import { HomeScreen } from './components/screens/HomeScreen';
import { ChapterMapScreen } from './components/screens/ChapterMapScreen';
import { GameHUD } from './components/hud/GameHUD';
import { BattlefieldCanvas } from './components/battlefield/BattlefieldCanvas';
import { RequestPanel } from './components/hud/RequestPanel';
import { BastionTerminal } from './components/terminal/BastionTerminal';
import { LearningView } from './components/learning/LearningView';
import { ClusterEventsLog } from './components/learning/ClusterEventsLog';
import { HintModal } from './components/modals/HintModal';
import { LevelCompleteModal } from './components/modals/LevelCompleteModal';
import { GameOverModal } from './components/modals/GameOverModal';
import { InteractiveTutorial } from './components/tutorial/InteractiveTutorial';

export const App: React.FC = () => {
  const { screen, isLearningViewOpen, isRequestPanelOpen } = useGameStore();

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

  const isSidebarVisible = isLearningViewOpen || isRequestPanelOpen;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#060810] text-[#F4F7FB] overflow-hidden select-none">
      {/* Top Strategic HUD Strip */}
      <GameHUD />

      {/* Main Gameplay Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left/Center Main Column: Battlefield + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Battlefield Area (3 Lanes + HTML5 Canvas) */}
          <div className="flex-1 relative min-h-[300px] overflow-hidden bg-[#060810]">
            <BattlefieldCanvas />
          </div>

          {/* Bottom Bastion Terminal */}
          <div className="h-64 sm:h-72 min-h-[220px] max-h-[420px] shrink-0 border-t border-[rgba(255,255,255,0.08)]">
            <BastionTerminal />
          </div>
        </div>

        {/* Right Docked Sidebar: Request Details & Control Plane Learning View */}
        {isSidebarVisible && (
          <aside className="w-80 md:w-88 border-l border-[rgba(255,255,255,0.07)] flex flex-col bg-[#0B0F19]/95 overflow-y-auto backdrop-blur-xl shrink-0 z-10 transition-all duration-300">
            <RequestPanel />
            <LearningView />
          </aside>
        )}
      </div>

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
