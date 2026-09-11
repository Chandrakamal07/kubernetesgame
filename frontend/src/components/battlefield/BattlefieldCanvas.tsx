import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../../state/useGameStore';
import { CanvasRenderer } from '../../engine/CanvasRenderer';
import { EntityManager } from '../../engine/EntityManager';
import { eventBus } from '../../engine/GameEventBus';
import { soundEngine } from '../../engine/AudioEngine';

export const BattlefieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cluster, activeRequest, isPaused, actions } = useGameStore();

  const entityManagerRef = useRef<EntityManager>(new EntityManager());
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const lastTimeRef = useRef<number>(0);
  const activeRequestRef = useRef(activeRequest);

  useEffect(() => {
    activeRequestRef.current = activeRequest;
  }, [activeRequest]);

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

    const unsubscribeSpawn = eventBus.on('CUSTOMER_SPAWNED', (req) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;
      const centerY = (req.lane + 0.5) * laneHeight;
      entityManager.spawnCustomer(req, rect.width, centerY);
    });

    const unsubscribeSatisfied = eventBus.on('OBJECTIVE_SATISFIED', ({ request, points, fulfillingNode }) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;

      // Authentic Kubernetes Firing: Originates strictly from fulfillingNode platform hosting the Pod
      const originLane = fulfillingNode ? fulfillingNode.laneIndex : request.lane;
      const targetLane = request.lane;

      const originCenterY = (originLane + 0.5) * laneHeight;
      const targetCenterY = (targetLane + 0.5) * laneHeight;
      const cannonX = 200;

      const targetCustomer = entityManager.customers.find((c) => c.request.id === request.id);
      const targetX = targetCustomer ? targetCustomer.pixelX : rect.width - 100;

      // Aim fulfilling node cannon barrel diagonally toward target
      const hostNode = cluster.nodes.find((n) => n.laneIndex === originLane);
      if (hostNode) {
        hostNode.turretAngle = Math.atan2(targetCenterY - originCenterY, targetX - cannonX);
        hostNode.lastFiredTimestamp = Date.now();
      }

      soundEngine.playCannonFire();
      entityManager.spawnProjectile(originLane, targetLane, cannonX, originCenterY, targetX, targetCenterY);

      setTimeout(() => {
        entityManager.spawnExplosionParticles(targetX, targetCenterY, '#4FD1C5', 30);
        entityManager.spawnFloatingText(`+${points} XP`, targetX, targetCenterY - 26, '#E3BC72');
        entityManager.spawnFloatingText('REQUEST SERVED!', targetX, targetCenterY - 44, '#64D98B');

        entityManager.customers = entityManager.customers.filter((c) => c.request.id !== request.id);

        setTimeout(() => {
          if (hostNode) hostNode.turretAngle = 0;
        }, 400);
      }, 340);
    });

    let animId: number;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      if (!isPaused) {
        entityManager.update(dt, 160);

        entityManager.customers.forEach((cust) => {
          if (cust.status === 'reached_node') {
            entityManager.spawnExplosionParticles(cust.pixelX, cust.pixelY, '#E56A72', 25);
            entityManager.spawnFloatingText('SLA BREACHED!', cust.pixelX, cust.pixelY - 20, '#E56A72');
            actions.handleCustomerReachedNode(cust.request);
            cust.status = 'hit';
          }
        });
        entityManager.customers = entityManager.customers.filter((c) => c.status === 'active');
      }

      renderer.render(dt, cluster.nodes, entityManager, activeRequestRef.current?.lane ?? null, isPaused);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      unsubscribeSpawn();
      unsubscribeSatisfied();
    };
  }, [cluster.nodes, isPaused, actions]);

  return (
    <div data-tutorial="battlefield" className="relative w-full h-full min-h-[300px] bg-[#060810] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
