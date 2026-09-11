import type { ScenarioRequest } from '../scenarios/types';

export interface CustomerEntity {
  id: string;
  request: ScenarioRequest;
  laneIndex: number;
  x: number;
  y: number;
  pixelX: number;
  pixelY: number;
  width: number;
  height: number;
  speed: number;
  walkCycle: number;
  status: 'active' | 'hit' | 'reached_node';
  remainingSlaSeconds: number;
  totalSlaSeconds: number;
}

export interface WorkloadCapsuleEntity {
  id: string;
  podName: string;
  image: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  progress: number;
  color: string;
  isComplete: boolean;
}

export interface ProjectileEntity {
  id: string;
  laneIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  radius: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  isComplete: boolean;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface SchedulerPulseEntity {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  targetNodeName: string;
  progress: number;
  status: 'evaluating' | 'matched' | 'rejected';
  alpha: number;
  color: string;
  isComplete: boolean;
}

export interface FloatingTextEntity {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  isComplete: boolean;
}

export class EntityManager {
  public customers: CustomerEntity[] = [];
  public capsules: WorkloadCapsuleEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public particles: ParticleEntity[] = [];
  public pulses: SchedulerPulseEntity[] = [];
  public floatingTexts: FloatingTextEntity[] = [];

  public clear() {
    this.customers = [];
    this.capsules = [];
    this.projectiles = [];
    this.particles = [];
    this.pulses = [];
    this.floatingTexts = [];
  }

  public spawnCustomer(request: ScenarioRequest, canvasWidth: number, laneCenterY: number): CustomerEntity {
    const baseSpeed = 12;
    const speedMultiplier = request.characterType === 'urgent' ? 1.4 : request.characterType === 'heavy' ? 0.75 : 1;
    const customer: CustomerEntity = {
      id: `cust-${request.id}-${Date.now()}`,
      request,
      laneIndex: request.lane,
      x: 1,
      y: laneCenterY,
      pixelX: canvasWidth + 20,
      pixelY: laneCenterY,
      width: 58,
      height: 64,
      speed: baseSpeed * speedMultiplier,
      walkCycle: 0,
      status: 'active',
      remainingSlaSeconds: request.slaTimeSeconds,
      totalSlaSeconds: request.slaTimeSeconds,
    };
    this.customers.push(customer);
    return customer;
  }

  public spawnWorkloadCapsule(podName: string, image: string, startX: number, startY: number, targetX: number, targetY: number): WorkloadCapsuleEntity {
    const capsule: WorkloadCapsuleEntity = {
      id: `cap-${Date.now()}`, podName, image, startX, startY, targetX, targetY,
      currentX: startX, currentY: startY, progress: 0,
      color: image.includes('redis') ? '#EF4444' : '#06B6D4', isComplete: false,
    };
    this.capsules.push(capsule);
    return capsule;
  }

  public spawnProjectile(laneIndex: number, startX: number, startY: number, targetX: number, targetY = startY): ProjectileEntity {
    const distance = Math.hypot(targetX - startX, targetY - startY);
    const projectile: ProjectileEntity = {
      id: `proj-${Date.now()}-${Math.random()}`,
      laneIndex,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX,
      targetY,
      progress: 0,
      speed: 480 / Math.max(distance, 1),
      radius: 7,
      color: '#00F0FF',
      trail: [],
      isComplete: false,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  public spawnSchedulerPulse(startX: number, startY: number, targetX: number, targetY: number, targetNodeName: string, isAccepted: boolean): SchedulerPulseEntity {
    const pulse: SchedulerPulseEntity = {
      id: `pulse-${Date.now()}-${Math.random()}`,
      startX, startY, targetX, targetY, targetNodeName,
      progress: 0,
      status: isAccepted ? 'matched' : 'rejected',
      alpha: 1,
      color: isAccepted ? '#10B981' : '#F59E0B',
      isComplete: false,
    };
    this.pulses.push(pulse);
    return pulse;
  }

  public spawnExplosionParticles(x: number, y: number, color = '#00F0FF', count = 28) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 30;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: i % 2 === 0 ? color : '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.3,
      });
    }
  }

  public spawnFloatingText(text: string, x: number, y: number, color = '#10B981') {
    this.floatingTexts.push({ id: `ft-${Date.now()}-${Math.random()}`, text, x, y, vy: -35, alpha: 1, color, isComplete: false });
  }

  public update(dt: number, nodeBaseX: number) {
    for (const c of this.customers) {
      if (c.status === 'active') {
        c.pixelX -= c.speed * dt;
        c.walkCycle += dt * 5;
        c.remainingSlaSeconds = Math.max(0, c.remainingSlaSeconds - dt);
        if (c.pixelX <= nodeBaseX + 70 || c.remainingSlaSeconds <= 0) c.status = 'reached_node';
      }
    }

    for (const cap of this.capsules) {
      if (!cap.isComplete) {
        cap.progress = Math.min(1, cap.progress + dt * 1.5);
        const t = cap.progress;
        const cpX = (cap.startX + cap.targetX) / 2 - 40;
        const cpY = Math.min(cap.startY, cap.targetY) - 50;
        cap.currentX = (1 - t) * (1 - t) * cap.startX + 2 * (1 - t) * t * cpX + t * t * cap.targetX;
        cap.currentY = (1 - t) * (1 - t) * cap.startY + 2 * (1 - t) * t * cpY + t * t * cap.targetY;
        if (t >= 1) cap.isComplete = true;
      }
    }
    this.capsules = this.capsules.filter((c) => !c.isComplete);

    for (const p of this.projectiles) {
      if (!p.isComplete) {
        p.trail.push({ x: p.currentX, y: p.currentY, alpha: 0.8 });
        if (p.trail.length > 8) p.trail.shift();
        p.trail.forEach((t) => { t.alpha = Math.max(0, t.alpha - dt * 3); });
        p.progress = Math.min(1, p.progress + p.speed * dt);
        const eased = 1 - Math.pow(1 - p.progress, 2);
        p.currentX = p.startX + (p.targetX - p.startX) * eased;
        p.currentY = p.startY + (p.targetY - p.startY) * eased;
        if (p.progress >= 1) p.isComplete = true;
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.isComplete);

    for (const pulse of this.pulses) {
      if (!pulse.isComplete) {
        pulse.progress = Math.min(1, pulse.progress + dt * 2.2);
        if (pulse.progress >= 1) pulse.isComplete = true;
      }
    }
    this.pulses = this.pulses.filter((p) => !p.isComplete);

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    for (const ft of this.floatingTexts) {
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.8;
      if (ft.alpha <= 0) ft.isComplete = true;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => !ft.isComplete);
  }
}
