export type GameEventType =
  | 'COMMAND_ACCEPTED'
  | 'POD_CREATED'
  | 'POD_SCHEDULED'
  | 'CONTAINER_CREATING'
  | 'POD_RUNNING'
  | 'POD_READY'
  | 'POD_DELETED'
  | 'FAILED_SCHEDULING'
  | 'CUSTOMER_SPAWNED'
  | 'REQUEST_SATISFYING'
  | 'CANNON_FIRED'
  | 'PROJECTILE_HIT'
  | 'REQUEST_SERVED'
  | 'REQUEST_BREACHED'
  | 'NODE_DAMAGED'
  | 'XP_AWARDED'
  | 'LEVEL_COMPLETED'
  | 'GAME_OVER'
  | 'OBJECTIVE_SATISFIED'
  | 'INSERT_TERMINAL_INPUT';

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
