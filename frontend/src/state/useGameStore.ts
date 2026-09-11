import { useState, useEffect } from 'react';
import { ClusterSimulator } from '../simulator/ClusterSimulator.ts';
import { CommandParser, type CommandResult } from '../simulator/CommandParser.ts';
import type { ClusterState, K8sNode, K8sPod } from '../simulator/types.ts';
import type { LevelConfig, RequestStatus, ScenarioRequest } from '../scenarios/types.ts';
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
  activeRequestStatus: RequestStatus;
  completedRequestIds: Set<string>;
  cluster: ClusterState;
  terminalHistory: TerminalEntry[];
  terminalInputToInsert: string | null;
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
  activeRequestStatus: 'ACTIVE',
  completedRequestIds: new Set<string>(),
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
      activeRequestStatus: 'ACTIVE',
      completedRequestIds: new Set<string>(),
      currentHintTier: 0,
      isHintModalOpen: false,
      isLearningViewOpen: true,
      isRequestPanelOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: true,
      tutorialStep: 0,
      isTutorialLevel: true,
      terminalInputToInsert: null,
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
      activeRequestStatus: 'ACTIVE',
      completedRequestIds: new Set<string>(),
      currentHintTier: 0,
      isHintModalOpen: false,
      isRequestPanelOpen: true,
      isPaused: false,
      commandsExecutedCount: 0,
      isTutorialActive: false,
      isTutorialLevel: levelId === 0,
      terminalInputToInsert: null,
      terminalHistory: [
        {
          id: `lvl-${Date.now()}`,
          command: `# Connected to Kubernetes Bastion: ${level.title}`,
          output: `Interactive Kubernetes Defense Terminal active (Kubernetes v1.30.0).\nActive Request: ${firstRequest ? firstRequest.title : 'None'}`,
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

    // Evaluate command/observation objectives immediately upon command execution
    gameActions.evaluateActiveObjective('COMMAND', result);

    return result.output;
  },

  /**
   * Event-driven objective evaluator.
   * Differentiates COMMAND/OBSERVATION satisfaction (immediate upon execution)
   * from STATE satisfaction (requires workload to be scheduled, running, and Ready).
   */
  evaluateActiveObjective(_trigger: 'COMMAND' | 'CLUSTER_STATE', cmdResult?: CommandResult) {
    const req = state.activeRequest;
    // Primary State Guard: Only evaluate if there is an active request in ACTIVE status and not completed
    if (!req || state.activeRequestStatus !== 'ACTIVE' || state.completedRequestIds.has(req.id)) {
      return;
    }

    const sim = getGlobalSimulator();
    const cluster = sim.getState();

    let isSatisfied = false;
    let fulfillingPod: K8sPod | null = null;
    let fulfillingNode: K8sNode | null = null;

    const type = req.requirements.type;

    // 1. Inspect Nodes Objective (COMMAND/OBSERVATION)
    if (type === 'inspect-nodes') {
      if (cmdResult && (cmdResult.commandType === 'get_nodes' || cmdResult.commandType === 'get_nodes_wide')) {
        isSatisfied = true;
      }
    }
    // 2. Inspect Pods Wide Objective (COMMAND/OBSERVATION)
    // CRITICAL: kubectl get pods -o json must NOT satisfy this! Only -o wide satisfies it.
    else if (type === 'inspect-pods-wide') {
      if (cmdResult && cmdResult.commandType === 'get_pods_wide') {
        isSatisfied = true;
      }
    }
    // 3. Describe Node Objective (COMMAND/OBSERVATION)
    else if (type === 'describe-node') {
      if (cmdResult && cmdResult.commandType === 'describe_node') {
        if (!req.requirements.nodeName || cmdResult.parsedObject?.nodeName === req.requirements.nodeName) {
          isSatisfied = true;
        }
      }
    }
    // 4. Describe Pod Objective (COMMAND/OBSERVATION)
    else if (type === 'describe-pod') {
      if (cmdResult && cmdResult.commandType === 'describe_pod') {
        if (!req.requirements.podName || cmdResult.parsedObject?.name === req.requirements.podName) {
          isSatisfied = true;
        }
      }
    }
    // 5. Create Pod Objective (STATE)
    // CRITICAL: Must check actual cluster state. Creating object in etcd is NOT enough.
    // Pod must be bound to a node, phase === Running, and ready === true.
    else if (type === 'create-pod') {
      const targetPod = cluster.pods.find((p) => {
        const nameMatches = p.name === req.requirements.podName;
        const imageMatches = req.requirements.image ? matchesRequiredImage(p.normalizedImage, req.requirements.image) : true;
        const cpuFits = !req.requirements.minCpu || (p.resources.requests?.cpu ?? 0) >= req.requirements.minCpu;
        const memFits = !req.requirements.minMem || (p.resources.requests?.memory ?? 0) >= req.requirements.minMem;
        
        const isReady = req.requirements.requireReady !== false ? (p.phase === 'Running' && p.ready === true) : true;

        return nameMatches && imageMatches && cpuFits && memFits && isReady;
      });

      if (targetPod && targetPod.nodeName) {
        isSatisfied = true;
        fulfillingPod = targetPod;
        fulfillingNode = cluster.nodes.find((n) => n.name === targetPod.nodeName) || null;
      }
    }
    // 6. Failed Scheduling Objective (STATE)
    // Pod exists, but is in Pending phase with FailedScheduling condition
    else if (type === 'failed-scheduling') {
      const pendingPod = cluster.pods.find((p) => {
        const nameMatches = p.name === req.requirements.podName;
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
    // 7. Delete Pod Objective (STATE)
    // Pod is removed from cluster state
    else if (type === 'delete-pod') {
      const podStillExists = cluster.pods.some((p) => p.name === req.requirements.podName);
      if (!podStillExists && cmdResult?.commandType === 'delete_pod') {
        isSatisfied = true;
      }
    }

    if (isSatisfied) {
      gameActions.beginSatisfyingRequest(req, fulfillingPod, fulfillingNode);
    }
  },

  /**
   * Transitions active request atomically: ACTIVE -> SATISFYING.
   * Emits REQUEST_SATISFYING so Battlefield cannon aims and fires toward the customer entity.
   * Customer stops moving and freezes SLA timer.
   */
  beginSatisfyingRequest(req: ScenarioRequest, fulfillingPod: K8sPod | null, fulfillingNode: K8sNode | null) {
    if (state.activeRequestStatus !== 'ACTIVE' || state.completedRequestIds.has(req.id)) {
      return;
    }

    // Atomically lock request into SATISFYING state to prevent double execution
    updateState(() => ({
      activeRequestStatus: 'SATISFYING',
    }));

    const node = fulfillingNode || state.cluster.nodes.find((n) => n.laneIndex === req.lane) || state.cluster.nodes[0] || null;

    eventBus.emit('REQUEST_SATISFYING', {
      requestId: req.id,
      request: req,
      fulfillingPod,
      fulfillingNode: node,
    });
  },

  /**
   * Finalizes request when the projectile physically reaches the customer entity.
   * Transitions SATISFYING -> SERVED.
   * Grants XP and increments SLA streak EXACTLY ONCE.
   */
  finalizeServedRequest(requestId: string) {
    const req = state.activeRequest;
    if (!req || req.id !== requestId || state.activeRequestStatus !== 'SATISFYING' || state.completedRequestIds.has(requestId)) {
      return;
    }

    const newCompleted = new Set(state.completedRequestIds);
    newCompleted.add(requestId);

    const sim = getGlobalSimulator();
    const hintPenalty = state.currentHintTier === 0 ? 50 : state.currentHintTier === 1 ? 0 : state.currentHintTier === 2 ? -5 : state.currentHintTier === 3 ? -10 : -20;
    const pointsAwarded = Math.max(50, req.rewardPoints + hintPenalty);

    // Update score and SLA streak in cluster state EXACTLY ONCE
    sim.updateScore(pointsAwarded, true);
    soundEngine.playImpact();

    updateState(() => ({
      activeRequestStatus: 'SERVED',
      completedRequestIds: newCompleted,
      playState: 'REQUEST_COMPLETED',
    }));

    eventBus.emit('REQUEST_SERVED', {
      requestId: req.id,
      points: pointsAwarded,
      request: req,
    });
    eventBus.emit('XP_AWARDED', {
      points: pointsAwarded,
      totalScore: sim.getState().score,
    });

    // Advance to next request after 600ms result feedback delay
    setTimeout(() => {
      const nextIdx = state.activeRequestIndex + 1;
      if (nextIdx < state.level.requests.length) {
        const nextReq = state.level.requests[nextIdx];
        updateState(() => ({
          activeRequestIndex: nextIdx,
          activeRequest: nextReq,
          activeRequestStatus: 'ACTIVE',
          currentHintTier: 0,
          playState: 'REQUEST_ACTIVE',
        }));

        soundEngine.playAlert();
        eventBus.emit('CUSTOMER_SPAWNED', nextReq);
      } else {
        updateState(() => ({
          playState: 'LEVEL_COMPLETE',
        }));
        soundEngine.playLevelComplete();
        eventBus.emit('LEVEL_COMPLETED', state.level);
      }
    }, 600);
  },

  handleCustomerReachedNode(customerReq: ScenarioRequest) {
    if (state.activeRequestStatus !== 'ACTIVE' || state.activeRequest?.id !== customerReq.id) {
      return;
    }

    updateState(() => ({
      activeRequestStatus: 'BREACHED',
    }));

    const sim = getGlobalSimulator();
    sim.damageNode(customerReq.lane, 25);
    sim.updateScore(0, false);
    soundEngine.playDamage();

    eventBus.emit('REQUEST_BREACHED', { requestId: customerReq.id, lane: customerReq.lane });
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

  insertTerminalInput(command: string) {
    updateState(() => ({ terminalInputToInsert: command }));
    eventBus.emit('INSERT_TERMINAL_INPUT', command);
  },

  clearTerminalInputInsert() {
    updateState(() => ({ terminalInputToInsert: null }));
  },
};

// Subscribe simulator state changes to global store and trigger event-driven objective evaluation
getGlobalSimulator().subscribe((clusterState) => {
  updateState(() => ({ cluster: clusterState }));
  // Event-driven evaluation when cluster state changes (e.g. pod reaches Ready, pod deleted)
  if (state.playState === 'REQUEST_ACTIVE' && state.activeRequestStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

// Subscribe to domain event bus
eventBus.on('POD_READY', () => {
  if (state.playState === 'REQUEST_ACTIVE' && state.activeRequestStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

eventBus.on('POD_DELETED', () => {
  if (state.playState === 'REQUEST_ACTIVE' && state.activeRequestStatus === 'ACTIVE') {
    gameActions.evaluateActiveObjective('CLUSTER_STATE');
  }
});

eventBus.on('PROJECTILE_HIT', ({ requestId }) => {
  gameActions.finalizeServedRequest(requestId);
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
    actions: gameActions,
  };
}
