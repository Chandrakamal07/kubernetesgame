import type { LessonMission } from '../scenarios/types.ts';

export interface MissionSignalEntity {
  id: string;
  mission: LessonMission;
  laneIndex: number;
  spawnX: number;
  targetNodeX: number;
  pixelX: number;
  pixelY: number;
  width: number;
  height: number;
  speed: number;
  pulsePhase: number;
  status: 'active' | 'satisfying' | 'served' | 'reached_node' | 'hit' | 'breached';
  remainingTimeToImpact: number;
  totalTimeToImpact: number;
  isChallengeMode: boolean;
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

export interface ScanPulseEntity {
  id: string;
  targetType: 'nodes' | 'pods';
  startX: number;
  startY: number;
  progress: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  isComplete: boolean;
}

export interface DiagnosticScanEntity {
  id: string;
  targetName: string;
  x: number;
  y: number;
  progress: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  isComplete: boolean;
}

export interface ServiceShieldEntity {
  id: string;
  nodeName: string;
  laneIndex: number;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  isComplete: boolean;
}

export interface ProjectileEntity {
  id: string;
  missionId: string;
  sourceNodeName: string;
  originLaneIndex: number;
  targetLaneIndex: number;
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
  public signals: MissionSignalEntity[] = [];
  public capsules: WorkloadCapsuleEntity[] = [];
  public scanPulses: ScanPulseEntity[] = [];
  public diagnosticScans: DiagnosticScanEntity[] = [];
  public serviceShields: ServiceShieldEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public particles: ParticleEntity[] = [];
  public floatingTexts: FloatingTextEntity[] = [];

  // Compatibility alias for customer entities
  public get customers(): any[] {
    return this.signals;
  }

  public clear() {
    this.signals = [];
    this.capsules = [];
    this.scanPulses = [];
    this.diagnosticScans = [];
    this.serviceShields = [];
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
  }

  /**
   * Idempotent mission entity synchronizer.
   * Ensures exactly one visual signal exists for the active mission without duplicating on re-renders.
   */
  public ensureMissionEntity(
    mission: LessonMission,
    canvasWidth: number,
    laneCenterY: number,
    isChallengeMode: boolean
  ): MissionSignalEntity {
    const existing = this.signals.find((s) => s.mission.id === mission.id);
    if (existing) {
      existing.pixelY = laneCenterY;
      existing.isChallengeMode = isChallengeMode;
      return existing;
    }

    const nodeThresholdX = 240;
    const spawnX = Math.max(canvasWidth - 40, nodeThresholdX + 300);
    const duration = isChallengeMode ? (mission.timeToImpactSeconds || 60) : 999999;

    const signal: MissionSignalEntity = {
      id: `sig-${mission.id}-${Date.now()}`,
      mission,
      laneIndex: mission.lane,
      spawnX,
      targetNodeX: nodeThresholdX,
      pixelX: spawnX,
      pixelY: laneCenterY,
      width: 54,
      height: 54,
      speed: (spawnX - nodeThresholdX) / duration,
      pulsePhase: 0,
      status: 'active',
      remainingTimeToImpact: duration,
      totalTimeToImpact: duration,
      isChallengeMode,
    };

    // Replace old signals with current active mission signal
    this.signals = [signal];
    return signal;
  }

  public spawnWorkloadCapsule(
    podName: string,
    image: string,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): WorkloadCapsuleEntity {
    const capsule: WorkloadCapsuleEntity = {
      id: `cap-${Date.now()}-${Math.random()}`,
      podName,
      image,
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      progress: 0,
      color: image.includes('redis') ? '#EF4444' : '#6EA8FE',
      isComplete: false,
    };
    this.capsules.push(capsule);
    return capsule;
  }

  public spawnScanPulse(targetType: 'nodes' | 'pods', startX: number, startY: number): ScanPulseEntity {
    const pulse: ScanPulseEntity = {
      id: `scan-${Date.now()}-${Math.random()}`,
      targetType,
      startX,
      startY,
      progress: 0,
      radius: 10,
      maxRadius: 360,
      alpha: 1.0,
      color: '#6EA8FE',
      isComplete: false,
    };
    this.scanPulses.push(pulse);
    return pulse;
  }

  public spawnDiagnosticScan(targetName: string, x: number, y: number): DiagnosticScanEntity {
    const scan: DiagnosticScanEntity = {
      id: `diag-${Date.now()}-${Math.random()}`,
      targetName,
      x,
      y,
      progress: 0,
      radius: 15,
      maxRadius: 180,
      alpha: 1.0,
      color: '#FBBF24',
      isComplete: false,
    };
    this.diagnosticScans.push(scan);
    return scan;
  }

  public spawnServiceShield(nodeName: string, laneIndex: number, x: number, y: number): ServiceShieldEntity {
    const shield: ServiceShieldEntity = {
      id: `shield-${Date.now()}-${Math.random()}`,
      nodeName,
      laneIndex,
      x,
      y,
      radius: 20,
      alpha: 1.0,
      isComplete: false,
    };
    this.serviceShields.push(shield);
    return shield;
  }

  public spawnProjectile(
    missionId: string,
    sourceNodeName: string,
    originLaneIndex: number,
    targetLaneIndex: number,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number
  ): ProjectileEntity {
    const projectile: ProjectileEntity = {
      id: `proj-${Date.now()}-${Math.random()}`,
      missionId,
      sourceNodeName,
      originLaneIndex,
      targetLaneIndex,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX,
      targetY,
      progress: 0,
      speed: 680,
      radius: 6,
      color: '#5EEAD4',
      trail: [],
      isComplete: false,
    };
    this.projectiles.push(projectile);
    return projectile;
  }

  public spawnExplosionParticles(x: number, y: number, color = '#6EA8FE', count = 24) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 110 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 1.5,
        color: i % 2 === 0 ? color : '#FFFFFF',
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.25,
      });
    }
  }

  public spawnFloatingText(text: string, x: number, y: number, color = '#4ADE80') {
    this.floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      vy: -35,
      alpha: 1.0,
      color,
      isComplete: false,
    });
  }

  public update(dt: number, nodeBaseX: number) {
    // 1. Update Mission Signals (Time to impact active only in Challenge mode)
    for (const s of this.signals) {
      s.pulsePhase += dt * 3;

      if (s.status === 'active') {
        if (s.isChallengeMode) {
          s.remainingTimeToImpact = Math.max(0, s.remainingTimeToImpact - dt);
          const progress = Math.min(1, Math.max(0, 1 - s.remainingTimeToImpact / s.totalTimeToImpact));
          s.pixelX = s.spawnX - progress * (s.spawnX - s.targetNodeX);

          if (s.remainingTimeToImpact <= 0 || s.pixelX <= nodeBaseX + 70) {
            s.status = 'reached_node';
          }
        } else {
          // In Learn and Practice modes, signal stays stationary at right edge
          s.pixelX = Math.max(nodeBaseX + 280, s.spawnX);
        }
      }
    }

    // 2. Update Workload Capsules
    for (const cap of this.capsules) {
      if (!cap.isComplete) {
        cap.progress += dt * 1.8;
        if (cap.progress >= 1) {
          cap.progress = 1;
          cap.isComplete = true;
          cap.currentX = cap.targetX;
          cap.currentY = cap.targetY;
        } else {
          const t = cap.progress;
          const cpX = (cap.startX + cap.targetX) / 2 - 30;
          const cpY = Math.min(cap.startY, cap.targetY) - 40;
          cap.currentX = (1 - t) * (1 - t) * cap.startX + 2 * (1 - t) * t * cpX + t * t * cap.targetX;
          cap.currentY = (1 - t) * (1 - t) * cap.startY + 2 * (1 - t) * t * cpY + t * t * cap.targetY;
        }
      }
    }
    this.capsules = this.capsules.filter((c) => !c.isComplete);

    // 3. Update Scan Pulses
    for (const scan of this.scanPulses) {
      if (!scan.isComplete) {
        scan.progress += dt * 2.0;
        scan.radius = scan.progress * scan.maxRadius;
        scan.alpha = Math.max(0, 1 - scan.progress);
        if (scan.progress >= 1) {
          scan.isComplete = true;
        }
      }
    }
    this.scanPulses = this.scanPulses.filter((s) => !s.isComplete);

    // 4. Update Diagnostic Scans
    for (const diag of this.diagnosticScans) {
      if (!diag.isComplete) {
        diag.progress += dt * 1.8;
        diag.radius = diag.progress * diag.maxRadius;
        diag.alpha = Math.max(0, 1 - diag.progress);
        if (diag.progress >= 1) {
          diag.isComplete = true;
        }
      }
    }
    this.diagnosticScans = this.diagnosticScans.filter((d) => !d.isComplete);

    // 5. Update Service Shields
    for (const shield of this.serviceShields) {
      shield.alpha -= dt * 1.2;
      shield.radius += dt * 25;
      if (shield.alpha <= 0) {
        shield.isComplete = true;
      }
    }
    this.serviceShields = this.serviceShields.filter((s) => !s.isComplete);

    // 6. Update Projectiles
    for (const p of this.projectiles) {
      if (!p.isComplete) {
        p.trail.push({ x: p.currentX, y: p.currentY, alpha: 0.8 });
        if (p.trail.length > 6) p.trail.shift();
        p.trail.forEach((t) => (t.alpha -= dt * 3));

        const totalDist = Math.hypot(p.targetX - p.startX, p.targetY - p.startY) || 1;
        const distStep = p.speed * dt;
        p.progress += distStep / totalDist;

        if (p.progress >= 1) {
          p.progress = 1;
          p.currentX = p.targetX;
          p.currentY = p.targetY;
          p.isComplete = true;

          this.spawnExplosionParticles(p.targetX, p.targetY, '#5EEAD4', 24);
          this.spawnFloatingText('MISSION COMPLETE!', p.targetX, p.targetY - 35, '#4ADE80');
        } else {
          p.currentX = p.startX + (p.targetX - p.startX) * p.progress;
          p.currentY = p.startY + (p.targetY - p.startY) * p.progress;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.isComplete);

    // 7. Update Particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    // 8. Update Floating Texts
    for (const ft of this.floatingTexts) {
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.9;
      if (ft.alpha <= 0) {
        ft.isComplete = true;
      }
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => !ft.isComplete);
  }
}
