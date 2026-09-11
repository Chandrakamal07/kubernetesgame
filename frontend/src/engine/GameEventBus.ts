export type GameEventType =
  | 'POD_CREATED'
  | 'POD_SCHEDULED'
  | 'POD_RUNNING'
  | 'POD_DELETED'
  | 'CANNON_FIRED'
  | 'CUSTOMER_SPAWNED'
  | 'CUSTOMER_HIT'
  | 'CUSTOMER_EXPIRED'
  | 'NODE_DAMAGED'
  | 'LEVEL_COMPLETED'
  | 'GAME_OVER'
  | 'OBJECTIVE_SATISFIED';

export type GameEventHandler = (payload: any) => void;

class GameEventBus {
  private handlers: Map<GameEventType, Set<GameEventHandler>> = new Map();

  public on(event: GameEventType, handler: GameEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  public emit(event: GameEventType, payload?: any) {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => handler(payload));
    }
  }
}

export const eventBus = new GameEventBus();
