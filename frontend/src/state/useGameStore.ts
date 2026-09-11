import { useState, useEffect } from 'react';
import { ClusterSimulator } from '../simulator/ClusterSimulator';
import { CommandParser } from '../simulator/CommandParser';
import type { ClusterState } from '../simulator/types';
import type { LevelConfig, ScenarioRequest } from '../scenarios/types';
import { chapter01Levels, tutorialLevel, allChapters } from '../scenarios/chapter01';
import { soundEngine } from '../engine/AudioEngine';
import { eventBus } from '../engine/GameEventBus';

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  success: boolean;
  timestamp: string;
}

export type ScreenState = 'home' | 'chapter-map' | 'game' | 'level-summary';
export type PlayState = 
  | 'INTRO'
  | 'REQUEST_ACTIVE'
  | 'SCHEDULING'
  | 'REQUEST_COMPLETED'
  | 'LEVEL_COMPLETE'
  | 'GAME_OVER'
  | 'PAUSED';

let globalSimulator: ClusterSimulator | null = null;
let globalParser: CommandParser | null = null;

export function getGlobalSimulator(): ClusterSimulator {
  if (!globalSimulator) {
    globalSimulator = new ClusterSimulator();
  }
  return globalSimulator;
}

export function getGlobalParser(): CommandParser {
  if (!globalParser) {
    globalParser = new CommandParser(getGlobalSimulator());
  }
  return globalParser;
}

export interface GameState {
  screen: ScreenState;
  playState: PlayState;
  chapterId: number;
  levelId: number;
  level: LevelConfig;
  activeRequestIndex: number;
  activeRequest: ScenarioRequest | null;
  cluster: ClusterState;
  terminalHistory: TerminalEntry[];
  currentHintTier: number;
  isHintModalOpen: boolean;
  isLearningViewOpen: boolean;
  isRequestPanelOpen: boolean;
  isEventsLogOpen: boolean;
  isPaused: boolean;
  isMuted: boolean;
  commandsExecutedCount: number;
  lastCommand: string;
  // Tutorial State
  isTutorialActive: boolean;
  tutorialStep: number;
  isTutorialLevel: boolean;
}

let state: GameState = {
  screen: 'home',
  playState: 'INTRO',
  chapterId: 1,
  levelId: 1,
  level: chapter01Levels[0],
  activeRequestIndex: 0,
  activeRequest: chapter01Levels[0].requests[0],
  cluster: getGlobalSimulator().getState(),
  terminalHistory: [
    {
      id: 'init-1',
      command: 'kubectl cluster-info',
      output: 'Kubernetes control plane is running at https://k8s.training.cluster.local:6443\n3 worker nodes available and Ready.\nUse "kubectl get nodes" or "kubectl get pods" to start defending the cluster.',
      success: true,
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  currentHintTier: 0,
  isHintModalOpen: false,
  isLearningViewOpen: true,
  isRequestPanelOpen: true,
  isEventsLogOpen: false,
  isPaused: false,
  isMuted: false,
  commandsExecutedCount: 0,
  lastCommand: '',
  isTutorialActive: false,
  tutorialStep: 0,
  isTutorialLevel: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function updateState(updater: (prev: GameState) => Partial<GameState>) {
  state = { ...state, ...updater(state) };
  notify();
}

getGlobalSimulator().subscribe((clusterState) => {
  updateState(() => ({ cluster: clusterState }));
});

export const gameActions = {
  setScreen(screen: ScreenState) {
    updateState(() => ({ screen }));
  },

  startTutorial() {
    const sim = getGlobalSimulator();
    sim.reset(tutorialLevel.initialNodes, 'tutorial-academy');

    const firstRequest = tutorialLevel.requests[0] || null;

    updateState(() => ({
      screen: 'game',
      playState: 'REQUEST_ACTIVE',
      chapterId: 1,
      levelId: 0,
      level: tutorialLevel,
      activeRequestIndex: 0,
      activeRequest: firstRequest,
      currentHintTier: 0,
      isHintModalOpen: false,
      isLearningViewOpen: true,
      isRequestPanelOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: true,
      tutorialStep: 0,
      isTutorialLevel: true,
      terminalHistory: [
        {
          id: `tut-${Date.now()}`,
          command: `# Connected to Kubernetes Academy Bastion Terminal`,
          output: `Interactive Kubernetes Defense Guided Tutorial started.\nActive Objective: ${firstRequest ? firstRequest.title : 'None'}`,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));

    soundEngine.playAlert();
    if (firstRequest) {
      eventBus.emit('CUSTOMER_SPAWNED', firstRequest);
    }
  },

  setTutorialStep(step: number) {
    soundEngine.playKeyClick();
    updateState(() => ({ tutorialStep: step }));
  },

  nextTutorialStep() {
    soundEngine.playKeyClick();
    updateState((prev) => ({ tutorialStep: prev.tutorialStep + 1 }));
  },

  prevTutorialStep() {
    soundEngine.playKeyClick();
    updateState((prev) => ({ tutorialStep: Math.max(0, prev.tutorialStep - 1) }));
  },

  skipTutorial() {
    soundEngine.playKeyClick();
    updateState(() => ({ isTutorialActive: false }));
  },

  finishTutorialAndStartLevel1() {
    soundEngine.playLevelComplete();
    gameActions.startLevel(1, 1);
  },

  startLevel(chapterId: number, levelId: number) {
    let level: LevelConfig;
    if (levelId === 0) {
      level = tutorialLevel;
    } else {
      const chapter = allChapters.find((c) => c.id === chapterId);
      level = chapter?.levels.find((l) => l.id === levelId) || chapter01Levels[0];
    }

    const sim = getGlobalSimulator();
    sim.reset(level.initialNodes, `chapter${chapterId}-level${levelId}`);

    const firstRequest = level.requests[0] || null;

    updateState(() => ({
      screen: 'game',
      playState: 'REQUEST_ACTIVE',
      chapterId,
      levelId,
      level,
      activeRequestIndex: 0,
      activeRequest: firstRequest,
      currentHintTier: 0,
      isHintModalOpen: false,
      isRequestPanelOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: false,
      isTutorialLevel: levelId === 0,
      terminalHistory: [
        {
          id: `lvl-${Date.now()}`,
          command: `# Connected to Kubernetes Bastion: ${level.title}`,
          output: `Interactive Kubernetes Defense Terminal active.\nActive Request: ${firstRequest ? firstRequest.title : 'None'}`,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));

    soundEngine.playAlert();
    if (firstRequest) {
      eventBus.emit('CUSTOMER_SPAWNED', firstRequest);
    }
  },

  executeCommand(rawCmd: string): string {
    const trimmed = rawCmd.trim();
    if (!trimmed) return '';

    soundEngine.playKeyClick();
    const parser = getGlobalParser();
    const result = parser.execute(trimmed);

    updateState((prev) => {
      const newHistory = [...prev.terminalHistory];
      if (result.output === '__CLEAR__') {
        return {
          terminalHistory: [],
          commandsExecutedCount: prev.commandsExecutedCount + 1,
          lastCommand: trimmed,
        };
      }

      newHistory.push({
        id: `cmd-${Date.now()}-${Math.random()}`,
        command: trimmed,
        output: result.output,
        success: result.success,
        timestamp: new Date().toLocaleTimeString(),
      });

      return {
        terminalHistory: newHistory.slice(-50),
        commandsExecutedCount: prev.commandsExecutedCount + 1,
        lastCommand: trimmed,
      };
    });

    gameActions.evaluateRequestSatisfaction(result);

    return result.output;
  },

  evaluateRequestSatisfaction(cmdResult: { commandType: string; parsedObject?: any }) {
    const req = state.activeRequest;
    if (!req) return;

    const sim = getGlobalSimulator();
    const cluster = sim.getState();

    let isSatisfied = false;

    if (req.requirements.type === 'inspect-nodes') {
      if (cmdResult.commandType === 'get_nodes' || cmdResult.commandType === 'get_nodes_wide') {
        isSatisfied = true;
      }
    } else if (req.requirements.type === 'inspect-pods-wide') {
      if (cmdResult.commandType === 'get_pods_wide') {
        isSatisfied = true;
      }
    } else if (req.requirements.type === 'describe-node') {
      if (cmdResult.commandType === 'describe_node' && (!req.requirements.nodeName || cmdResult.parsedObject?.nodeName === req.requirements.nodeName)) {
        isSatisfied = true;
      }
    } else if (req.requirements.type === 'create-pod') {
      const matchingPod = cluster.pods.find(
        (p) =>
          p.name === req.requirements.podName &&
          p.image.includes(req.requirements.image || '') &&
          (!req.requirements.minCpu || p.cpuRequest >= req.requirements.minCpu) &&
          (!req.requirements.minMem || p.memoryRequest >= req.requirements.minMem)
      );

      if (matchingPod) {
        isSatisfied = true;
      }
    }

    if (isSatisfied) {
      gameActions.completeActiveRequest();
    }
  },

  completeActiveRequest() {
    const req = state.activeRequest;
    if (!req) return;

    const sim = getGlobalSimulator();
    
    const hintPenalty = state.currentHintTier === 0 ? 50 : state.currentHintTier === 1 ? 0 : state.currentHintTier === 2 ? -5 : state.currentHintTier === 3 ? -10 : -20;
    const pointsAwarded = Math.max(50, req.rewardPoints + hintPenalty);
    sim.updateScore(pointsAwarded, true);

    soundEngine.playImpact();
    eventBus.emit('OBJECTIVE_SATISFIED', { request: req, points: pointsAwarded });

    const nextIdx = state.activeRequestIndex + 1;
    if (nextIdx < state.level.requests.length) {
      const nextReq = state.level.requests[nextIdx];
      updateState(() => ({
        activeRequestIndex: nextIdx,
        activeRequest: nextReq,
        currentHintTier: 0,
        playState: 'REQUEST_ACTIVE',
      }));

      setTimeout(() => {
        soundEngine.playAlert();
        eventBus.emit('CUSTOMER_SPAWNED', nextReq);
      }, 1000);
    } else {
      updateState(() => ({
        playState: 'LEVEL_COMPLETE',
      }));
      soundEngine.playLevelComplete();
      eventBus.emit('LEVEL_COMPLETED', state.level);
    }
  },

  handleCustomerReachedNode(customerReq: ScenarioRequest) {
    const sim = getGlobalSimulator();
    sim.damageNode(customerReq.lane, 25);
    sim.updateScore(0, false);
    soundEngine.playDamage();

    eventBus.emit('NODE_DAMAGED', { laneIndex: customerReq.lane, health: sim.getState().health });

    if (sim.getState().health <= 0) {
      updateState(() => ({ playState: 'GAME_OVER' }));
      eventBus.emit('GAME_OVER');
    }
  },

  unlockNextHint() {
    if (state.currentHintTier < 4) {
      const deductions = [0, 0, 5, 10, 20];
      const nextTier = state.currentHintTier + 1;
      const penalty = deductions[nextTier] || 0;

      const sim = getGlobalSimulator();
      sim.recordHintUsed(penalty);

      updateState(() => ({ currentHintTier: nextTier }));
    }
  },

  openHintModal() {
    updateState(() => ({ isHintModalOpen: true }));
  },

  closeHintModal() {
    updateState(() => ({ isHintModalOpen: false }));
  },

  toggleLearningView() {
    updateState((prev) => ({ isLearningViewOpen: !prev.isLearningViewOpen }));
  },

  toggleRequestPanel() {
    updateState((prev) => ({ isRequestPanelOpen: !prev.isRequestPanelOpen }));
  },

  toggleEventsLog() {
    updateState((prev) => ({ isEventsLogOpen: !prev.isEventsLogOpen }));
  },

  togglePause() {
    updateState((prev) => ({ isPaused: !prev.isPaused }));
  },

  toggleMute() {
    const nextMute = !state.isMuted;
    soundEngine.setMuted(nextMute);
    updateState(() => ({ isMuted: nextMute }));
  },
};

export function useGameStore() {
  const [storeState, setStoreState] = useState<GameState>(state);

  useEffect(() => {
    const update = () => setStoreState({ ...state });
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    ...storeState,
    actions: gameActions,
  };
}
