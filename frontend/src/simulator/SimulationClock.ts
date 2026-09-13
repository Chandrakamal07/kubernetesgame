export interface ScheduledSimulationAction {
  id: string;
  scope: string; // e.g. 'pod:<uid>', 'global', 'mission:<id>'
  dueAt: number; // Virtual timestamp when action should fire
  epoch: number; // Simulation epoch
  execute: () => void;
}

export class SimulationClock {
  private currentTime: number = 0;
  private isPaused: boolean = false;
  private currentEpoch: number = 0;
  private scheduledActions: ScheduledSimulationAction[] = [];
  private rafId: number | null = null;
  private lastRealTime: number = 0;
  private actionSeq: number = 0;

  constructor() {
    this.lastRealTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  public get now(): number {
    return this.currentTime;
  }

  public get paused(): boolean {
    return this.isPaused;
  }

  public get epoch(): number {
    return this.currentEpoch;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (!paused) {
      this.lastRealTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
  }

  public schedule(
    delayMs: number,
    scope: string,
    execute: () => void
  ): string {
    const id = `act-${++this.actionSeq}-${Math.random().toString(36).substring(2, 7)}`;
    const action: ScheduledSimulationAction = {
      id,
      scope,
      dueAt: this.currentTime + Math.max(0, delayMs),
      epoch: this.currentEpoch,
      execute,
    };
    this.scheduledActions.push(action);
    return id;
  }

  public cancelScope(scope: string) {
    this.scheduledActions = this.scheduledActions.filter((a) => a.scope !== scope);
  }

  public cancelAction(actionId: string) {
    this.scheduledActions = this.scheduledActions.filter((a) => a.id !== actionId);
  }

  public advance(deltaMs: number) {
    if (this.isPaused || deltaMs <= 0) return;

    const targetTime = this.currentTime + deltaMs;

    while (true) {
      // Find the earliest due action at or before targetTime
      let earliestIdx = -1;
      let earliestTime = Infinity;

      for (let i = 0; i < this.scheduledActions.length; i++) {
        const action = this.scheduledActions[i];
        if (action.epoch === this.currentEpoch && action.dueAt <= targetTime) {
          if (action.dueAt < earliestTime) {
            earliestTime = action.dueAt;
            earliestIdx = i;
          }
        }
      }

      if (earliestIdx === -1) {
        // No more actions due before targetTime
        this.currentTime = targetTime;
        break;
      }

      const [action] = this.scheduledActions.splice(earliestIdx, 1);
      // Advance clock to this action's timestamp before executing it
      this.currentTime = action.dueAt;

      if (action.epoch === this.currentEpoch) {
        action.execute();
      }
    }
  }

  public reset() {
    this.currentEpoch += 1;
    this.scheduledActions = [];
    this.currentTime = 0;
    this.isPaused = false;
  }

  /**
   * Starts a real-time animation tick driver for the clock in browser environments.
   */
  public startBrowserLoop(): () => void {
    if (typeof window === 'undefined') return () => {};

    this.lastRealTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(100, now - this.lastRealTime);
      this.lastRealTime = now;

      if (!this.isPaused) {
        this.advance(dt);
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);

    return () => {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };
  }
}

export const globalSimulationClock = new SimulationClock();
