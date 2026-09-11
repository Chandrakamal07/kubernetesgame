import type { EntityManager, CustomerEntity, ProjectileEntity } from './EntityManager';
import type { K8sNode } from '../simulator/types';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private animTime: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setDimensions(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public render(
    dt: number,
    nodes: K8sNode[],
    entities: EntityManager,
    selectedLane: number | null = null,
    isPaused = false
  ) {
    if (!isPaused) {
      this.animTime += dt;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Rich Deep Datacenter Grid
    this.drawBackground(ctx, w, h);

    // 2. Draw 3 Strategic Lanes
    const laneHeight = h / 3;
    for (let i = 0; i < 3; i++) {
      this.drawLane(ctx, i, laneHeight, w, selectedLane === i);
    }

    // 3. Draw Cluster Control Plane Base Pillar (Leftmost)
    this.drawControlPlaneBase(ctx, h);

    // 4. Draw Worker Node Platforms & Defense Cannons
    nodes.forEach((node) => {
      const centerY = (node.laneIndex + 0.5) * laneHeight;
      this.drawWorkerNode(ctx, node, 160, centerY);
    });

    // 5. Draw Scheduler Pulses
    entities.pulses.forEach((pulse) => {
      this.drawSchedulerPulse(ctx, pulse);
    });

    // 6. Draw Workload Capsules in flight
    entities.capsules.forEach((cap) => {
      this.drawWorkloadCapsule(ctx, cap);
    });

    // 7. Draw Projectile Lasers
    entities.projectiles.forEach((proj) => {
      this.drawProjectile(ctx, proj);
    });

    // 8. Draw Incoming Customers
    entities.customers.forEach((cust) => {
      this.drawCustomer(ctx, cust);
    });

    // 9. Draw Particle Explosions
    entities.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 10. Draw Floating HUD Texts
    entities.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 10;
      ctx.font = 'bold 13px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#050711');
    grad.addColorStop(0.5, '#080B17');
    grad.addColorStop(1, '#050711');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.strokeStyle = 'rgba(79, 124, 255, 0.04)';
    ctx.lineWidth = 1;

    const gridSize = 48;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Subtle server rack lights on far right
    ctx.fillStyle = 'rgba(17, 24, 42, 0.3)';
    for (let rx = w - 160; rx < w; rx += 45) {
      ctx.fillRect(rx, 12, 30, h - 24);
      for (let ly = 24; ly < h - 24; ly += 20) {
        const isBlinking = Math.sin(this.animTime * 2.5 + rx + ly) > 0.4;
        ctx.fillStyle = isBlinking ? '#4F7CFF' : 'rgba(79, 124, 255, 0.15)';
        ctx.fillRect(rx + 4, ly, 3, 2.5);
        ctx.fillStyle = isBlinking ? '#32D5D2' : 'rgba(50, 213, 210, 0.15)';
        ctx.fillRect(rx + 11, ly, 3, 2.5);
        ctx.fillStyle = 'rgba(17, 24, 42, 0.3)';
      }
    }
    ctx.restore();
  }

  private drawLane(
    ctx: CanvasRenderingContext2D,
    laneIndex: number,
    laneHeight: number,
    w: number,
    isSelected: boolean
  ) {
    const yTop = laneIndex * laneHeight;
    const yBottom = yTop + laneHeight;

    ctx.save();

    // Lane separator line
    ctx.strokeStyle = isSelected ? 'rgba(79, 124, 255, 0.4)' : 'rgba(132, 156, 205, 0.08)';
    ctx.lineWidth = isSelected ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, yBottom);
    ctx.lineTo(w, yBottom);
    ctx.stroke();

    // Animated dashed center track
    const centerY = yTop + laneHeight / 2;
    ctx.strokeStyle = isSelected ? 'rgba(79, 124, 255, 0.15)' : 'rgba(132, 156, 205, 0.04)';
    ctx.setLineDash([6, 18]);
    ctx.lineDashOffset = -this.animTime * 20;
    ctx.beginPath();
    ctx.moveTo(260, centerY);
    ctx.lineTo(w, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lane identifier watermark
    ctx.fillStyle = 'rgba(127, 140, 163, 0.15)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LANE 0${laneIndex + 1} // INGRESS`, w - 16, yTop + 18);

    ctx.restore();
  }

  private drawControlPlaneBase(ctx: CanvasRenderingContext2D, h: number) {
    ctx.save();

    const baseW = 90;
    const grad = ctx.createLinearGradient(0, 0, baseW + 20, 0);
    grad.addColorStop(0, '#080B17');
    grad.addColorStop(0.85, '#11182A');
    grad.addColorStop(1, 'rgba(17, 24, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, baseW + 20, h);

    // Edge line
    ctx.strokeStyle = 'rgba(79, 124, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(baseW, 0);
    ctx.lineTo(baseW, h);
    ctx.stroke();

    const coreY = h / 2;
    const pulseSize = 20 + Math.sin(this.animTime * 3) * 2;
    
    // Outer breathing ring
    ctx.strokeStyle = 'rgba(79, 124, 255, 0.5)';
    ctx.shadowColor = '#4F7CFF';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(42, coreY, pulseSize, 0, Math.PI * 2);
    ctx.stroke();

    // Central Core Orb
    ctx.fillStyle = '#4F7CFF';
    ctx.beginPath();
    ctx.arc(42, coreY, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#F7F9FF';
    ctx.font = 'bold 9px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTROL', 42, coreY - 28);
    ctx.fillText('PLANE', 42, coreY - 18);

    ctx.fillStyle = '#7F8CA3';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillText('API-SERVER', 42, coreY + 28);
    ctx.fillText('ETCD', 42, coreY + 38);

    ctx.restore();
  }

  private drawWorkerNode(
    ctx: CanvasRenderingContext2D,
    node: K8sNode,
    x: number,
    y: number
  ) {
    ctx.save();

    const isReady = node.status === 'Ready';
    const isCharging = node.isCharging;
    const healthFrac = node.health / 100;

    // Platform Base Chassis
    ctx.fillStyle = '#11182A';
    ctx.strokeStyle = isReady ? 'rgba(79, 124, 255, 0.45)' : 'rgba(240, 109, 120, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 56, y - 46, 112, 92, 10);
    ctx.fill();
    ctx.stroke();

    // Turret Barrel (Cannon) pointing right
    ctx.save();
    ctx.translate(x + 28, y);
    const timeSinceFire = node.lastFiredTimestamp ? (Date.now() - node.lastFiredTimestamp) / 1000 : 999;
    const recoilOffset = timeSinceFire < 0.18 ? -10 * (1 - timeSinceFire / 0.18) : 0;

    const barrelGrad = ctx.createLinearGradient(0, -7, 36, 7);
    barrelGrad.addColorStop(0, '#151E33');
    barrelGrad.addColorStop(1, isCharging ? '#32D5D2' : '#2A3752');
    ctx.fillStyle = barrelGrad;
    ctx.fillRect(recoilOffset, -6, 32, 12);

    ctx.strokeStyle = isCharging ? '#32D5D2' : '#5A6E8C';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(recoilOffset + 22, -8, 6, 16);

    if (isCharging || node.ammoCount > 0) {
      ctx.shadowColor = '#32D5D2';
      ctx.shadowBlur = isCharging ? 16 : 8;
      ctx.fillStyle = '#32D5D2';
      ctx.beginPath();
      ctx.arc(recoilOffset + 32, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Central Node Core
    ctx.fillStyle = '#151E33';
    ctx.beginPath();
    ctx.arc(x + 12, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isReady ? '#54D98C' : '#F06D78';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ready Status Indicator Dot
    ctx.fillStyle = isReady ? '#54D98C' : '#F06D78';
    ctx.beginPath();
    ctx.arc(x + 12, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Node Name Tag
    ctx.fillStyle = '#F7F9FF';
    ctx.font = 'bold 11px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x - 10, y - 28);

    // Health Bar
    const barW = 82;
    const barH = 4;
    ctx.fillStyle = '#1D283E';
    ctx.fillRect(x - 46, y - 22, barW, barH);
    ctx.fillStyle = healthFrac > 0.5 ? '#54D98C' : healthFrac > 0.2 ? '#F2B95F' : '#F06D78';
    ctx.fillRect(x - 46, y - 22, barW * healthFrac, barH);

    // Resource Meters: CPU & MEM
    const cpuFrac = Math.min(1, node.cpuAllocated / node.cpuCapacity);
    const memFrac = Math.min(1, node.memoryAllocated / node.memoryCapacity);

    ctx.fillStyle = '#7F8CA3';
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`CPU ${node.cpuAllocated.toFixed(1)}/${node.cpuCapacity}c`, x - 46, y + 19);
    ctx.fillStyle = '#151E33';
    ctx.fillRect(x - 46, y + 22, 82, 3.5);
    ctx.fillStyle = '#4F7CFF';
    ctx.fillRect(x - 46, y + 22, 82 * cpuFrac, 3.5);

    ctx.fillStyle = '#7F8CA3';
    ctx.fillText(`RAM ${node.memoryAllocated}/${node.memoryCapacity}M`, x - 46, y + 34);
    ctx.fillStyle = '#151E33';
    ctx.fillRect(x - 46, y + 37, 82, 3.5);
    ctx.fillStyle = '#7765F8';
    ctx.fillRect(x - 46, y + 37, 82 * memFrac, 3.5);

    // Ammo Nodes
    for (let a = 0; a < 3; a++) {
      const hasAmmo = a < node.ammoCount;
      ctx.fillStyle = hasAmmo ? '#32D5D2' : 'rgba(127, 140, 163, 0.3)';
      ctx.shadowColor = hasAmmo ? '#32D5D2' : 'transparent';
      ctx.shadowBlur = hasAmmo ? 6 : 0;
      ctx.beginPath();
      ctx.arc(x - 32 + a * 11, y - 5, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCustomer(ctx: CanvasRenderingContext2D, cust: CustomerEntity) {
    const { pixelX, pixelY, request, remainingSlaSeconds, totalSlaSeconds, walkCycle } = cust;
    const isUrgent = request.characterType === 'urgent' || request.characterType === 'escalation';

    ctx.save();

    const legOffset = Math.sin(walkCycle) * 5;

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(pixelX, pixelY + 26, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#7F8CA3';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pixelX - 5, pixelY + 12);
    ctx.lineTo(pixelX - 5 + legOffset, pixelY + 24);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pixelX + 5, pixelY + 12);
    ctx.lineTo(pixelX + 5 - legOffset, pixelY + 24);
    ctx.stroke();

    // Body
    const bodyColor = isUrgent ? '#38161B' : '#11182A';
    const borderColor = isUrgent ? '#F06D78' : '#4F7CFF';
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pixelX - 15, pixelY - 13, 30, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Visor
    ctx.fillStyle = isUrgent ? '#F06D78' : '#32D5D2';
    ctx.fillRect(pixelX - 9, pixelY - 7, 18, 4.5);

    // Briefcase payload
    ctx.fillStyle = '#080B17';
    ctx.strokeStyle = '#7F8CA3';
    ctx.lineWidth = 1;
    ctx.fillRect(pixelX - 20, pixelY, 12, 10);
    ctx.strokeRect(pixelX - 20, pixelY, 12, 10);

    // Overhead Compact Ticket Card & SLA Meter
    const cardW = 92;
    const cardH = 24;
    const cardX = pixelX - cardW / 2;
    const cardY = pixelY - 42;

    ctx.fillStyle = 'rgba(13, 18, 32, 0.95)';
    ctx.strokeStyle = isUrgent ? '#F06D78' : 'rgba(79, 124, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F7F9FF';
    ctx.font = 'bold 9px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'left';
    const reqText =
      request.requirements.type === 'inspect-nodes'
        ? 'get nodes'
        : request.requirements.type === 'inspect-pods-wide'
        ? 'get pods -o wide'
        : request.requirements.type === 'describe-node'
        ? `desc ${request.requirements.nodeName}`
        : `${request.requirements.podName || 'pod'}`;
    ctx.fillText(reqText, cardX + 5, cardY + 11);

    const slaFrac = Math.max(0, remainingSlaSeconds / totalSlaSeconds);
    ctx.fillStyle = '#151E33';
    ctx.fillRect(cardX + 5, cardY + 15, cardW - 10, 3.5);

    const slaColor = slaFrac > 0.5 ? '#54D98C' : slaFrac > 0.25 ? '#F2B95F' : '#F06D78';
    ctx.fillStyle = slaColor;
    ctx.fillRect(cardX + 5, cardY + 15, (cardW - 10) * slaFrac, 3.5);

    ctx.restore();
  }

  private drawWorkloadCapsule(ctx: CanvasRenderingContext2D, cap: { currentX: number; currentY: number; color: string; podName: string; image: string }) {
    ctx.save();
    ctx.shadowColor = cap.color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = cap.color;
    ctx.beginPath();
    ctx.arc(cap.currentX, cap.currentY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cap.currentX, cap.currentY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#F7F9FF';
    ctx.font = 'bold 9px "JetBrains Mono", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cap.podName, cap.currentX, cap.currentY - 14);

    ctx.restore();
  }

  private drawProjectile(ctx: CanvasRenderingContext2D, proj: ProjectileEntity) {
    ctx.save();

    proj.trail.forEach((t) => {
      ctx.globalAlpha = t.alpha * 0.6;
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, proj.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = proj.color;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(proj.currentX, proj.currentY, proj.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = proj.color;
    ctx.fillRect(proj.currentX - 22, proj.currentY - 2.5, 22, 5);

    ctx.restore();
  }

  private drawSchedulerPulse(ctx: CanvasRenderingContext2D, pulse: { startX: number; startY: number; targetX: number; targetY: number; progress: number; color: string }) {
    ctx.save();
    const t = pulse.progress;
    const curX = pulse.startX + (pulse.targetX - pulse.startX) * t;
    const curY = pulse.startY + (pulse.targetY - pulse.startY) * t;

    ctx.strokeStyle = pulse.color;
    ctx.shadowColor = pulse.color;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pulse.startX, pulse.startY);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
