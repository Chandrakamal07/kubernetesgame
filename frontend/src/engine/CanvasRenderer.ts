import type { K8sNode } from '../simulator/types.ts';
import type { EntityManager } from './EntityManager.ts';
import { formatCpu, formatMemory } from '../simulator/imageUtils.ts';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 800;
  private height: number = 500;
  private gridOffset: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public render(
    dt: number,
    nodes: K8sNode[],
    entityManager: EntityManager,
    activeLaneIndex: number | null,
    isPaused: boolean,
    reducedMotion: boolean = false
  ) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (!reducedMotion && !isPaused) {
      this.gridOffset = (this.gridOffset + dt * 15) % 32;
    }

    // 1. Clear background
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, w, h);

    // 2. Subtle grid
    this.renderGrid(ctx, w, h);

    // 3. Render 3 Mission Lanes
    const laneHeight = h / 3;
    for (let i = 0; i < 3; i++) {
      const y = i * laneHeight;
      const isActive = activeLaneIndex === i;

      ctx.fillStyle = isActive ? 'rgba(110, 168, 254, 0.04)' : 'rgba(14, 22, 37, 0.35)';
      ctx.fillRect(0, y + 2, w, laneHeight - 4);

      ctx.strokeStyle = isActive ? 'rgba(110, 168, 254, 0.18)' : 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Lane badge
      ctx.fillStyle = isActive ? 'rgba(110, 168, 254, 0.65)' : 'rgba(129, 144, 167, 0.35)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`PATH-${i + 1}`, 12, y + 18);
    }

    // 4. Render Control Plane Hub
    this.renderControlPlaneHub(ctx);

    // 5. Render Worker Nodes
    const nodeBaseX = 50;
    nodes.forEach((node, idx) => {
      const laneY = (idx + 0.5) * laneHeight;
      this.renderWorkerNode(ctx, node, nodeBaseX, laneY);
    });

    // 6. Render Scan Pulses
    entityManager.scanPulses.forEach((scan) => {
      ctx.strokeStyle = `rgba(110, 168, 254, ${scan.alpha * 0.75})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(scan.startX, scan.startY, scan.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 7. Render Diagnostic Scans
    entityManager.diagnosticScans.forEach((diag) => {
      ctx.strokeStyle = `rgba(251, 191, 36, ${diag.alpha * 0.85})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(diag.x, diag.y, diag.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 8. Render Service Shields
    entityManager.serviceShields.forEach((shield) => {
      ctx.fillStyle = `rgba(74, 222, 128, ${shield.alpha * 0.25})`;
      ctx.strokeStyle = `rgba(74, 222, 128, ${shield.alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shield.x, shield.y, shield.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 9. Render Workload Capsules (in-flight scheduling)
    entityManager.capsules.forEach((cap) => {
      ctx.fillStyle = cap.color;
      ctx.shadowColor = cap.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cap.currentX, cap.currentY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(cap.podName, cap.currentX + 12, cap.currentY + 4);
    });

    // 10. Render Cross-Lane Projectiles (Challenge mode reward)
    entityManager.projectiles.forEach((p) => {
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.startX, p.startY);
      p.trail.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(p.currentX, p.currentY);
      ctx.stroke();

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.currentX, p.currentY, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 11. Render Mission Signals
    entityManager.signals.forEach((s) => {
      this.renderMissionSignal(ctx, s, reducedMotion);
    });

    // 12. Render Particles
    entityManager.particles.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // 13. Render Floating Text
    entityManager.floatingTexts.forEach((ft) => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1.0;
    });
  }

  private renderGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.strokeStyle = 'rgba(21, 31, 49, 0.6)';
    ctx.lineWidth = 1;
    const step = 32;

    for (let x = this.gridOffset; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private renderControlPlaneHub(ctx: CanvasRenderingContext2D) {
    const hubX = 18;
    const hubY = 18;

    ctx.fillStyle = '#0E1625';
    ctx.strokeStyle = 'rgba(110, 168, 254, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hubX, hubY, 150, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.arc(hubX + 12, hubY + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6EA8FE';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText('CONTROL PLANE: ACTIVE', hubX + 22, hubY + 16);
  }

  private renderWorkerNode(
    ctx: CanvasRenderingContext2D,
    node: K8sNode,
    baseX: number,
    centerY: number
  ) {
    const cardW = 160;
    const cardH = 92;
    const x = baseX;
    const y = centerY - cardH / 2;

    // Outer card container
    ctx.fillStyle = '#0E1625';
    ctx.strokeStyle = node.status === 'Ready' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(251, 113, 133, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // Node header: Name & Status pill
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.fillText(node.name, x + 10, y + 18);

    ctx.fillStyle = node.status === 'Ready' ? '#4ADE80' : '#FB7185';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(node.status, x + cardW - (node.status === 'Ready' ? 40 : 54), y + 18);

    // CPU Allocatable Gauge
    const freeCpu = Math.max(0, node.cpuAllocatable - node.cpuRequested);
    const cpuUsedPct = Math.min(1, node.cpuRequested / Math.max(0.1, node.cpuAllocatable));

    ctx.fillStyle = '#8190A7';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`CPU: ${formatCpu(freeCpu)} free / ${formatCpu(node.cpuAllocatable)}`, x + 10, y + 34);

    ctx.fillStyle = '#151F31';
    ctx.fillRect(x + 10, y + 38, cardW - 20, 5);
    ctx.fillStyle = cpuUsedPct > 0.85 ? '#FB7185' : '#6EA8FE';
    ctx.fillRect(x + 10, y + 38, (cardW - 20) * cpuUsedPct, 5);

    // Memory Allocatable Gauge
    const freeMem = Math.max(0, node.memoryAllocatable - node.memoryRequested);
    const memUsedPct = Math.min(1, node.memoryRequested / Math.max(1, node.memoryAllocatable));

    ctx.fillStyle = '#8190A7';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText(`RAM: ${formatMemory(freeMem)} free / ${formatMemory(node.memoryAllocatable)}`, x + 10, y + 54);

    ctx.fillStyle = '#151F31';
    ctx.fillRect(x + 10, y + 58, cardW - 20, 5);
    ctx.fillStyle = memUsedPct > 0.85 ? '#FB7185' : '#5EEAD4';
    ctx.fillRect(x + 10, y + 58, (cardW - 20) * memUsedPct, 5);

    // Pod chips on this node
    ctx.fillStyle = '#B8C4D6';
    ctx.font = '9px JetBrains Mono, monospace';
    const podText = node.pods.length === 0 ? 'Pods: <none>' : `Pods (${node.pods.length}): ${node.pods.join(', ')}`;
    const truncated = podText.length > 24 ? podText.substring(0, 22) + '…' : podText;
    ctx.fillText(truncated, x + 10, y + 78);
  }

  private renderMissionSignal(
    ctx: CanvasRenderingContext2D,
    signal: any,
    reducedMotion: boolean
  ) {
    const x = signal.pixelX;
    const y = signal.pixelY;
    const size = 50;

    // Glowing technical beacon
    ctx.fillStyle = '#0E1625';
    ctx.strokeStyle = signal.status === 'satisfying' ? '#4ADE80' : '#6EA8FE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - size / 2, y - size / 2, size, size, 10);
    ctx.fill();
    ctx.stroke();

    // Pulse ring
    if (!reducedMotion) {
      const pulseSize = (Math.sin(signal.pulsePhase) + 1) * 4;
      ctx.strokeStyle = 'rgba(110, 168, 254, 0.3)';
      ctx.beginPath();
      ctx.roundRect(x - size / 2 - pulseSize, y - size / 2 - pulseSize, size + pulseSize * 2, size + pulseSize * 2, 12);
      ctx.stroke();
    }

    ctx.fillStyle = '#6EA8FE';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIGNAL', x, y - 6);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`L${signal.mission.lessonNumber}`, x, y + 10);
    ctx.textAlign = 'left';

    // Show Time to Impact only in Challenge Mode
    if (signal.isChallengeMode && signal.remainingTimeToImpact < 9999) {
      const t = Math.ceil(signal.remainingTimeToImpact);
      ctx.fillStyle = t < 15 ? '#FB7185' : '#FBBF24';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`${t}s`, x - 10, y + size / 2 + 14);
    }
  }
}
