import type { K8sPod, K8sNode } from '../simulator/types';
import type { LessonMission, LevelConfig, VisualEffectType } from '../scenarios/types';

export interface GameEventMap {
  COMMAND_ACCEPTED: { rawCommand: string };
  POD_CREATED: { podUid: string; podName: string; pod: K8sPod };
  POD_SCHEDULED: { podUid: string; nodeName: string; pod: K8sPod; node: K8sNode };
  POD_READY: { podUid: string; nodeName: string; pod: K8sPod; node: K8sNode };
  POD_DELETED: { podUid: string; podName: string };
  SCAN_PULSE_REQUESTED: { targetType: 'nodes' | 'pods' };
  DIAGNOSTIC_SCAN_REQUESTED: { targetName: string };
  MISSION_ACTIVATED: { mission: LessonMission };
  MISSION_SATISFIED: { missionId: string; effect: VisualEffectType; fulfillingPod?: K8sPod | null; fulfillingNode?: K8sNode | null };
  MISSION_COMPLETED: { missionId: string; points: number; mission: LessonMission };
  MISSION_FAILED: { missionId: string; reason: string };
  CORE_INTEGRITY_CHANGED: { coreIntegrity: number };
  LEVEL_COMPLETED: { level: LevelConfig };
  GAME_OVER: { reason?: string };
  INSERT_TERMINAL_INPUT: { command: string };
}

export type GameEventType = keyof GameEventMap;
export type GameEventHandler<T extends GameEventType> = (payload: GameEventMap[T]) => void;

class TypedGameEventBus {
  private handlers: Map<GameEventType, Set<GameEventHandler<any>>> = new Map();

  public on<T extends GameEventType>(event: T, handler: GameEventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off<T extends GameEventType>(event: T, handler: GameEventHandler<T>) {
    this.handlers.get(event)?.delete(handler);
  }

  public emit<T extends GameEventType>(event: T, payload: GameEventMap[T]) {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (err) {
          console.error(`Error in EventBus handler for ${String(event)}:`, err);
        }
      });
    }
  }
}

export const eventBus = new TypedGameEventBus();
