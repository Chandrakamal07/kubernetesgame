import { useState, useEffect } from 'react';
import { ClusterSimulator } from '../simulator/ClusterSimulator.ts';
import { CommandParser, type CommandResult } from '../simulator/CommandParser.ts';
import type { KubernetesClusterState, K8sPod, K8sNode } from '../simulator/types.ts';
import type {
  LessonMission,
  LevelConfig,
  LearningMode,
  MissionStatus,
  PersistedProgressV1,
} from '../scenarios/types.ts';
import { chapter01Levels, tutorialLevel, allChapters } from '../scenarios/chapter01.ts';
import { soundEngine } from '../engine/AudioEngine.ts';
import { eventBus } from '../engine/GameEventBus.ts';
import { matchesRequiredImage } from '../simulator/imageUtils.ts';

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
  | 'MISSION_ACTIVE'
  | 'RESOLVING'
  | 'MISSION_COMPLETED'
  | 'LEVEL_COMPLETE'
  | 'FAILED_RETRYABLE'
  | 'GAME_OVER'
  | 'PAUSED';

export type ActiveSidebarTab = 'mission' | 'tracer' | 'glossary';

const STORAGE_KEY = 'k8s_defense_progress_v1';

export function loadPersistedProgress(): PersistedProgressV1 {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {
      version: 1,
      mode: 'LEARN',
      completedLessonIds: [],
      bestScores: {},
      preferences: { muted: false, reducedMotion: false, terminalExpanded: false },
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        version: 1,
        mode: 'LEARN',
        completedLessonIds: [],
        bestScores: {},
        preferences: { muted: false, reducedMotion: false, terminalExpanded: false },
      };
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return {
        version: 1,
        mode: parsed.mode || 'LEARN',
        completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
        bestScores: parsed.bestScores || {},
        preferences: {
          muted: !!parsed.preferences?.muted,
          reducedMotion: !!parsed.preferences?.reducedMotion,
          terminalExpanded: !!parsed.preferences?.terminalExpanded,
        },
        lastOpenedLessonId: parsed.lastOpenedLessonId,
      };
    }
  } catch (err) {
    console.warn('Failed to load persisted progress from localStorage:', err);
  }

  return {
    version: 1,
    mode: 'LEARN',
    completedLessonIds: [],
    bestScores: {},
    preferences: { muted: false, reducedMotion: false, terminalExpanded: false },
  };
}

export function savePersistedProgress(progress: PersistedProgressV1) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save persisted progress:', err);
  }
}

let globalSimulator: ClusterSimulator | null = null;
let globalParser: CommandParser | null = null;

export function getGlobalSimulator(): ClusterSimulator {
  if (!globalSimulator) {
    globalSimulator = new ClusterSimulator();
    globalSimulator.getClock().startBrowserLoop();
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
  mode: LearningMode;
  chapterId: number;
  levelId: number;
  level: LevelConfig;
  activeMissionIndex: number;
  activeMission: LessonMission | null;
  activeMissionStatus: MissionStatus;
  completedMissionIds: Set<string>;
  cluster: KubernetesClusterState;
  terminalHistory: TerminalEntry[];
  terminalInputToInsert: string | null;
  currentHintTier: number;
  isHintModalOpen: boolean;
  isEventsLogOpen: boolean;
  isPaused: boolean;
  isMuted: boolean;
  isReducedMotion: boolean;
  isTerminalExpanded: boolean;
  activeSidebarTab: ActiveSidebarTab;
  isSidebarOpen: boolean;
  score: number;
  successStreak: number;
  coreIntegrity: number; // 0 - 100% (fictional shield)
  commandsExecutedCount: number;
  lastCommand: string;
  // Tutorial State
  isTutorialActive: boolean;
  tutorialStep: number;
  isTutorialLevel: boolean;
  // Legacy aliases
  activeRequest?: LessonMission | null;
  activeRequestIndex?: number;
  activeRequestStatus?: any;
  isLearningViewOpen?: boolean;
  isRequestPanelOpen?: boolean;
}

const initialPersisted = loadPersistedProgress();

let state: GameState = {
  screen: 'home',
  playState: 'INTRO',
  mode: initialPersisted.mode,
  chapterId: 1,
  levelId: 1,
  level: chapter01Levels[0],
  activeMissionIndex: 0,
  activeMission: chapter01Levels[0].missions[0],
  activeMissionStatus: 'ACTIVE',
  completedMissionIds: new Set<string>(initialPersisted.completedLessonIds),
  cluster: getGlobalSimulator().getState(),
  terminalHistory: [
    {
      id: 'init-1',
      command: 'kubectl cluster-info',
      output: 'Kubernetes control plane is running at https://k8s.training.cluster.local:6443\n3 worker nodes available and Ready.\nUse "kubectl get nodes", "kubectl run web-01 --image=nginx", or "kubectl apply -f compute-01.yaml" to start defending the cluster.',
      success: true,
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  terminalInputToInsert: null,
  currentHintTier: 0,
  isHintModalOpen: false,
  isEventsLogOpen: false,
  isPaused: false,
  isMuted: initialPersisted.preferences.muted,
  isReducedMotion: initialPersisted.preferences.reducedMotion,
  isTerminalExpanded: initialPersisted.preferences.terminalExpanded,
  activeSidebarTab: 'mission',
  isSidebarOpen: true,
  score: 0,
  successStreak: 0,
  coreIntegrity: 100,
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

function persistCurrentProgress() {
  const current: PersistedProgressV1 = {
    version: 1,
    mode: state.mode,
    completedLessonIds: Array.from(state.completedMissionIds),
    bestScores: {},
    preferences: {
      muted: state.isMuted,
      reducedMotion: state.isReducedMotion,
      terminalExpanded: state.isTerminalExpanded,
    },
    lastOpenedLessonId: state.activeMission?.id,
  };
  savePersistedProgress(current);
}

export function calculateMissionScore(
  basePoints: number,
  mode: LearningMode,
  uniqueHintTiersUsed: number
): number {
  if (mode === 'LEARN') return basePoints;
  if (mode === 'PRACTICE') {
    return Math.max(50, basePoints - uniqueHintTiersUsed * 10);
  }
  return Math.max(50, basePoints - uniqueHintTiersUsed * 20);
}

export const gameActions = {
  setScreen(screen: ScreenState) {
    updateState(() => ({ screen }));
  },

  setMode(mode: LearningMode) {
    updateState(() => ({ mode }));
    persistCurrentProgress();
  },

  startTutorial() {
    const sim = getGlobalSimulator();
    sim.reset(tutorialLevel.initialNodes, 'tutorial-academy');

    const firstMission = tutorialLevel.missions[0] || null;

    updateState(() => ({
      screen: 'game',
      playState: 'MISSION_ACTIVE',
      chapterId: 1,
      levelId: 0,
      level: tutorialLevel,
      activeMissionIndex: 0,
      activeMission: firstMission,
      activeMissionStatus: 'ACTIVE',
      currentHintTier: 0,
      isHintModalOpen: false,
      activeSidebarTab: 'mission',
      isSidebarOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: true,
      tutorialStep: 0,
      isTutorialLevel: true,
      terminalInputToInsert: null,
      terminalHistory: [
        {
          id: `tut-${Date.now()}`,
          command: `# Connected to Kubernetes Academy Simulation Terminal`,
          output: `Interactive Kubernetes Defense Guided Tutorial started.\nActive Mission: ${firstMission ? firstMission.title : 'None'}`,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));

    soundEngine.playAlert();
    if (firstMission) {
      eventBus.emit('MISSION_ACTIVATED', { mission: firstMission });
    }
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

    const firstMission = level.missions[0] || null;

    updateState(() => ({
      screen: 'game',
      playState: 'MISSION_ACTIVE',
      chapterId,
      levelId,
      level,
      activeMissionIndex: 0,
      activeMission: firstMission,
      activeMissionStatus: 'ACTIVE',
      currentHintTier: 0,
      isHintModalOpen: false,
      activeSidebarTab: 'mission',
      isSidebarOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: false,
      isTutorialLevel: levelId === 0,
      terminalInputToInsert: null,
      terminalHistory: [
        {
          id: `lvl-${Date.now()}`,
          command: `# Connected to Kubernetes Terminal: ${level.title}`,
          output: `Interactive Kubernetes Defense Terminal active (Kubernetes v1.30.0).\nActive Mission: ${firstMission ? firstMission.title : 'None'}`,
          success: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    }));

    soundEngine.playAlert();
    if (firstMission) {
      eventBus.emit('MISSION_ACTIVATED', { mission: firstMission });
    }
    persistCurrentProgress();
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

    // Trigger visual scan / diagnostic wave effects based on command
    if (result.success) {
      if (result.commandType === 'get_nodes' || result.commandType === 'get_nodes_wide') {
        eventBus.emit('SCAN_PULSE_REQUESTED', { targetType: 'nodes' });
      } else if (result.commandType === 'get_pods' || result.commandType === 'get_pods_wide') {
        eventBus.emit('SCAN_PULSE_REQUESTED', { targetType: 'pods' });
      } else if (result.commandType === 'describe_node' || result.commandType === 'describe_pod') {
        eventBus.emit('DIAGNOSTIC_SCAN_REQUESTED', { targetName: result.parsedObject?.name || result.parsedObject?.nodeName || '' });
      }
    }

    // Evaluate command/observation objectives immediately
    gameActions.evaluateActiveObjective('COMMAND', result);

    return result.output;
  },

  /**
   * Event-driven objective evaluator.
   * Differentiates COMMAND/OBSERVATION/INTERACTION satisfaction from STATE satisfaction.
   */
  evaluateActiveObjective(_trigger: 'COMMAND' | 'CLUSTER_STATE' | 'INTERACTION', cmdResult?: CommandResult) {
    const mission = state.activeMission;
    if (!mission || state.activeMissionStatus !== 'ACTIVE' || state.completedMissionIds.has(mission.id)) {
      return;
    }

    const sim = getGlobalSimulator();
    const cluster = sim.getState();

    let isSatisfied = false;
    let fulfillingPod: K8sPod | null = null;
    let fulfillingNode: K8sNode | null = null;

    const rule = mission.completionRule;

    // 0. Interaction / Component discovery
    if (rule.type === 'inspect-cluster-components' || rule.type === 'concept-review') {
      if (_trigger === 'INTERACTION') {
        isSatisfied = true;
      }
    }
    // 1. Inspect Nodes Objective
    else if (rule.type === 'inspect-nodes') {
      if (cmdResult && (cmdResult.commandType === 'get_nodes' || cmdResult.commandType === 'get_nodes_wide')) {
        isSatisfied = true;
      }
    }
    // 2. Inspect Pods Objective
    else if (rule.type === 'inspect-pods') {
      if (cmdResult && (cmdResult.commandType === 'get_pods' || cmdResult.commandType === 'get_pods_wide')) {
        isSatisfied = true;
      }
    }
    // 3. Inspect Pods Wide Objective
    else if (rule.type === 'inspect-pods-wide') {
      if (cmdResult && cmdResult.commandType === 'get_pods_wide') {
        isSatisfied = true;
      }
    }
    // 4. Describe Node Objective
    else if (rule.type === 'describe-node') {
      if (cmdResult && cmdResult.commandType === 'describe_node') {
        if (!rule.nodeName || cmdResult.parsedObject?.nodeName === rule.nodeName) {
          isSatisfied = true;
        }
      }
    }
    // 5. Describe Pod Objective
    else if (rule.type === 'describe-pod') {
      if (cmdResult && cmdResult.commandType === 'describe_pod') {
        if (!rule.podName || cmdResult.parsedObject?.name === rule.podName) {
          isSatisfied = true;
        }
      }
    }
    // 6. Create Pod Objective (STATE)
    else if (rule.type === 'create-pod') {
      const targetPod = cluster.pods.find((p) => {
        const nameMatches = p.name === rule.podName;
        const imageMatches = rule.image ? matchesRequiredImage(p.normalizedImage, rule.image) : true;
        const cpuFits = !rule.minCpu || (p.resources.requests?.cpu ?? 0) >= rule.minCpu;
        const memFits = !rule.minMem || (p.resources.requests?.memory ?? 0) >= rule.minMem;
        const isReady = rule.requireReady !== false ? (p.phase === 'Running' && p.ready === true) : true;

        return nameMatches && imageMatches && cpuFits && memFits && isReady;
      });

      if (targetPod && targetPod.nodeName) {
        isSatisfied = true;
        fulfillingPod = targetPod;
        fulfillingNode = cluster.nodes.find((n) => n.name === targetPod.nodeName) || null;
      }
    }
    // 7. Failed Scheduling Objective (STATE)
    else if (rule.type === 'failed-scheduling') {
      const pendingPod = cluster.pods.find((p) => {
        const nameMatches = p.name === rule.podName;
        const isPending = p.phase === 'Pending';
        const hasFailedSched = p.conditions.some(
          (c) => c.type === 'PodScheduled' && c.status === 'False' && c.reason === 'FailedScheduling'
        );
        return nameMatches && isPending && hasFailedSched;
      });

      if (pendingPod) {
        isSatisfied = true;
        fulfillingPod = pendingPod;
        fulfillingNode = cluster.nodes[0] || null;
      }
    }
    // 8. Delete Pod Objective (STATE)
    else if (rule.type === 'delete-pod') {
      const podStillExists = cluster.pods.some((p) => p.name === rule.podName);
      if (!podStillExists && cmdResult?.commandType === 'delete_pod') {
        isSatisfied = true;
      }
    }

    if (isSatisfied) {
      gameActions.beginResolvingMission(mission, fulfillingPod, fulfillingNode);
    }
  },

  beginResolvingMission(mission: LessonMission, fulfillingPod: K8sPod | null, fulfillingNode: K8sNode | null) {
    if (state.activeMissionStatus !== 'ACTIVE' || state.completedMissionIds.has(mission.id)) {
      return;
    }

    updateState(() => ({
      activeMissionStatus: 'RESOLVING',
      playState: 'RESOLVING',
    }));

    eventBus.emit('MISSION_SATISFIED', {
      missionId: mission.id,
      effect: mission.gameEffect,
      fulfillingPod,
      fulfillingNode,
    });

    // Finalize mission resolution
    setTimeout(() => {
      gameActions.finalizeMission(mission.id);
    }, 450);
  },

  finalizeMission(missionId: string) {
    const mission = state.activeMission;
    if (!mission || mission.id !== missionId || state.completedMissionIds.has(missionId)) {
      return;
    }

    const newCompleted = new Set(state.completedMissionIds);
    newCompleted.add(missionId);

    const pointsAwarded = calculateMissionScore(mission.basePoints, state.mode, state.currentHintTier);
    const newScore = state.score + pointsAwarded;
    const newStreak = state.successStreak + 1;

    soundEngine.playLevelComplete();

    updateState(() => ({
      activeMissionStatus: 'COMPLETED',
      completedMissionIds: newCompleted,
      playState: 'MISSION_COMPLETED',
      score: newScore,
      successStreak: newStreak,
    }));

    eventBus.emit('MISSION_COMPLETED', {
      missionId: mission.id,
      points: pointsAwarded,
      mission,
    });

    persistCurrentProgress();
  },

  advanceToNextMission() {
    const nextIdx = state.activeMissionIndex + 1;
    if (nextIdx < state.level.missions.length) {
      const nextMission = state.level.missions[nextIdx];
      updateState(() => ({
        activeMissionIndex: nextIdx,
        activeMission: nextMission,
        activeMissionStatus: 'ACTIVE',
        currentHintTier: 0,
        playState: 'MISSION_ACTIVE',
      }));

      soundEngine.playAlert();
      eventBus.emit('MISSION_ACTIVATED', { mission: nextMission });
    } else {
      updateState(() => ({
        playState: 'LEVEL_COMPLETE',
      }));
      soundEngine.playLevelComplete();
      eventBus.emit('LEVEL_COMPLETED', { level: state.level });
    }
    persistCurrentProgress();
  },

  retryMission() {
    const mission = state.activeMission;
    if (!mission) return;

    updateState(() => ({
      activeMissionStatus: 'ACTIVE',
      playState: 'MISSION_ACTIVE',
      currentHintTier: 0,
    }));

    soundEngine.playAlert();
    eventBus.emit('MISSION_ACTIVATED', { mission });
  },

  handleTimeToImpactExpired(mission: LessonMission) {
    if (state.mode !== 'CHALLENGE' || state.activeMissionStatus !== 'ACTIVE' || state.activeMission?.id !== mission.id) {
      return;
    }

    const newIntegrity = Math.max(0, state.coreIntegrity - 25);
    soundEngine.playDamage();

    updateState(() => ({
      activeMissionStatus: 'FAILED_RETRYABLE',
      playState: 'FAILED_RETRYABLE',
      coreIntegrity: newIntegrity,
      successStreak: 0,
    }));

    eventBus.emit('MISSION_FAILED', {
      missionId: mission.id,
      reason: 'Time to impact expired before workload was ready.',
    });
    eventBus.emit('CORE_INTEGRITY_CHANGED', { coreIntegrity: newIntegrity });

    if (newIntegrity <= 0) {
      updateState(() => ({ playState: 'GAME_OVER' }));
      eventBus.emit('GAME_OVER', { reason: 'Core integrity depleted.' });
    }
  },

  resetAllProgress() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }

    updateState(() => ({
      completedMissionIds: new Set<string>(),
      score: 0,
      successStreak: 0,
      coreIntegrity: 100,
      mode: 'LEARN',
    }));

    soundEngine.playKeyClick();
  },

  unlockNextHint() {
    if (state.currentHintTier < 4) {
      updateState((prev) => ({ currentHintTier: prev.currentHintTier + 1 }));
    }
  },

  openHintModal() {
    updateState(() => ({ isHintModalOpen: true }));
  },

  closeHintModal() {
    updateState(() => ({ isHintModalOpen: false }));
  },

  setActiveSidebarTab(tab: ActiveSidebarTab) {
    updateState(() => ({ activeSidebarTab: tab, isSidebarOpen: true }));
  },

  toggleSidebar() {
    updateState((prev) => ({ isSidebarOpen: !prev.isSidebarOpen }));
  },

  toggleEventsLog() {
    updateState((prev) => ({ isEventsLogOpen: !prev.isEventsLogOpen }));
  },

  togglePause() {
    const nextPaused = !state.isPaused;
    getGlobalSimulator().getClock().setPaused(nextPaused);
    updateState(() => ({ isPaused: nextPaused }));
  },

  toggleMute() {
    const nextMute = !state.isMuted;
    soundEngine.setMuted(nextMute);
    updateState(() => ({ isMuted: nextMute }));
    persistCurrentProgress();
  },

  toggleReducedMotion() {
    const nextVal = !state.isReducedMotion;
    updateState(() => ({ isReducedMotion: nextVal }));
    persistCurrentProgress();
  },

  toggleTerminalExpanded() {
    updateState((prev) => ({ isTerminalExpanded: !prev.isTerminalExpanded }));
    persistCurrentProgress();
  },

  insertTerminalInput(command: string) {
    updateState(() => ({ terminalInputToInsert: command }));
    eventBus.emit('INSERT_TERMINAL_INPUT', { command });
  },

  clearTerminalInputInsert() {
    updateState(() => ({ terminalInputToInsert: null }));
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
};

// Subscribe simulator state changes to global store
getGlobalSimulator().subscribe((clusterState) => {
  updateState(() => ({ cluster: clusterState }));
  if (state.playState === 'MISSION_ACTIVE' && state.activeMissionStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

// Subscribe to domain event bus
eventBus.on('POD_READY', () => {
  if (state.playState === 'MISSION_ACTIVE' && state.activeMissionStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

eventBus.on('POD_DELETED', () => {
  if (state.playState === 'MISSION_ACTIVE' && state.activeMissionStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

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
    // Provide compatibility aliases
    activeRequest: storeState.activeMission,
    activeRequestIndex: storeState.activeMissionIndex,
    activeRequestStatus: storeState.activeMissionStatus,
    isLearningViewOpen: storeState.isSidebarOpen && storeState.activeSidebarTab === 'tracer',
    isRequestPanelOpen: storeState.isSidebarOpen && storeState.activeSidebarTab === 'mission',
    actions: gameActions,
  };
}
