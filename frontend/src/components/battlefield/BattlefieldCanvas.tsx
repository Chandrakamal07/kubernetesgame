import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { CanvasRenderer } from '../../engine/CanvasRenderer';
import { EntityManager } from '../../engine/EntityManager';
import { eventBus } from '../../engine/GameEventBus';
import { soundEngine } from '../../engine/AudioEngine';

export const BattlefieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cluster, activeMission, isPaused, isReducedMotion, mode, actions } = useGameStore();

  const entityManagerRef = useRef<EntityManager>(new EntityManager());
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const lastTimeRef = useRef<number>(0);
  const activeMissionRef = useRef(activeMission);
  const modeRef = useRef(mode);

  useEffect(() => {
    activeMissionRef.current = activeMission;
    modeRef.current = mode;
  }, [activeMission, mode]);

  // Synchronize active mission entity idempotently whenever active mission changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeMission) return;

    const rect = canvas.getBoundingClientRect();
    const laneHeight = (rect.height || 300) / 3;
    const centerY = (activeMission.lane + 0.5) * laneHeight;

    entityManagerRef.current.ensureMissionEntity(
      activeMission,
      rect.width || 800,
      centerY,
      mode === 'CHALLENGE'
    );
  }, [activeMission, mode]);

  useEffect(() => {
    lastTimeRef.current = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new CanvasRenderer(ctx);
    rendererRef.current = renderer;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      renderer.setDimensions(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const entityManager = entityManagerRef.current;

    const unsubScan = eventBus.on('SCAN_PULSE_REQUESTED', ({ targetType }) => {
      entityManager.spawnScanPulse(targetType, 90, 30);
    });

    const unsubDiag = eventBus.on('DIAGNOSTIC_SCAN_REQUESTED', () => {
      const rect = canvas.getBoundingClientRect();
      entityManager.spawnDiagnosticScan('target', 130, rect.height / 2);
    });

    const unsubScheduled = eventBus.on('POD_SCHEDULED', ({ pod, node }) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;
      const nodeIdx = cluster.nodes.findIndex((n) => n.name === node.name);
      const targetY = (Math.max(0, nodeIdx) + 0.5) * laneHeight;

      entityManager.spawnWorkloadCapsule(pod.name, pod.image, 90, 30, 130, targetY);
    });

    const unsubReady = eventBus.on('POD_READY', ({ node }) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;
      const nodeIdx = cluster.nodes.findIndex((n) => n.name === node.name);
      const targetY = (Math.max(0, nodeIdx) + 0.5) * laneHeight;

      entityManager.spawnServiceShield(node.name, nodeIdx, 130, targetY);
      soundEngine.playCannonFire();
    });

    const unsubSatisfied = eventBus.on('MISSION_SATISFIED', ({ missionId, effect, fulfillingNode }) => {
      const rect = canvas.getBoundingClientRect();
      const currentMission = activeMissionRef.current;
      if (!currentMission) return;

      const laneHeight = rect.height / 3;
      const originLane = fulfillingNode
        ? Math.max(0, cluster.nodes.findIndex((n) => n.name === fulfillingNode.name))
        : currentMission.lane;
      const targetLane = currentMission.lane;

      const originCenterY = (originLane + 0.5) * laneHeight;
      const targetCenterY = (targetLane + 0.5) * laneHeight;

      if (effect === 'DEPLOY' || modeRef.current === 'CHALLENGE') {
        entityManager.spawnProjectile(
          missionId,
          fulfillingNode?.name || 'worker-1',
          originLane,
          targetLane,
          130,
          originCenterY,
          rect.width - 60,
          targetCenterY
        );
      } else if (effect === 'SCAN' || effect === 'VERIFY') {
        entityManager.spawnScanPulse('nodes', 90, 30);
        entityManager.spawnFloatingText('VERIFIED!', rect.width - 90, targetCenterY, '#4ADE80');
      } else if (effect === 'DIAGNOSE') {
        entityManager.spawnDiagnosticScan('diagnose', 130, targetCenterY);
        entityManager.spawnFloatingText('DIAGNOSED!', rect.width - 90, targetCenterY, '#FBBF24');
      } else if (effect === 'CLEANUP') {
        entityManager.spawnExplosionParticles(130, targetCenterY, '#FB7185', 20);
        entityManager.spawnFloatingText('CLEANED UP!', rect.width - 90, targetCenterY, '#FB7185');
      }
    });

    let animId: number;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (!isPaused) {
        entityManager.update(dt, 160);

        // Handle challenge mode time expiration
        entityManager.signals.forEach((sig) => {
          if (sig.status === 'reached_node') {
            entityManager.spawnExplosionParticles(sig.pixelX, sig.pixelY, '#FB7185', 20);
            entityManager.spawnFloatingText('IMPACT REACHED!', sig.pixelX, sig.pixelY - 20, '#FB7185');
            actions.handleTimeToImpactExpired(sig.mission);
            sig.status = 'hit';
          }
        });
        entityManager.signals = entityManager.signals.filter((s) => s.status !== 'hit');
      }

      renderer.render(
        dt,
        cluster.nodes,
        entityManager,
        activeMissionRef.current?.lane ?? null,
        isPaused,
        isReducedMotion
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      unsubScan();
      unsubDiag();
      unsubScheduled();
      unsubReady();
      unsubSatisfied();
    };
  }, [cluster.nodes, isPaused, isReducedMotion, actions]);

  return (
    <div
      data-tutorial="battlefield"
      className="relative w-full h-full min-h-[280px] bg-[#070B14] overflow-hidden select-none"
      role="region"
      aria-label="Kubernetes Cluster Simulation Battlefield"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Accessible DOM Summary for Screen Readers & Assistive Tech */}
      <div className="sr-only" aria-live="polite">
        <h3>Cluster Status Summary</h3>
        <p>Control Plane: Active and managing namespace {cluster.namespace}.</p>
        <ul>
          {cluster.nodes.map((node) => (
            <li key={node.name}>
              {node.name}: Status {node.status}, Allocatable CPU {node.cpuAllocatable - node.cpuRequested} cores free of {node.cpuAllocatable},
              Allocatable RAM {node.memoryAllocatable - node.memoryRequested}Mi free of {node.memoryAllocatable}Mi.
              Running Pods: {node.pods.length > 0 ? node.pods.join(', ') : 'None'}.
            </li>
          ))}
        </ul>
        {activeMission && (
          <p>
            Current Mission: {activeMission.title}. Goal: {activeMission.goal.plainLanguage}
          </p>
        )}
      </div>
    </div>
  );
};
