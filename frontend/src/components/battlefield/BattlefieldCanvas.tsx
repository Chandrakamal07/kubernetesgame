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

  useEffect(() => { activeRequestRef.current = activeRequest; }, [activeRequest]);

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderer.setDimensions(rect.width, rect.height);
    };

    resize();
    window.addEventListener('resize', resize);
    const entityManager = entityManagerRef.current;

    const unsubscribeSpawn = eventBus.on('CUSTOMER_SPAWNED', (req) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;
      entityManager.spawnCustomer(req, rect.width, (req.lane + 0.5) * laneHeight);
    });

    const unsubscribeSatisfied = eventBus.on('OBJECTIVE_SATISFIED', ({ request, points, nodeLane }) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;
      const targetLaneCenterY = (request.lane + 0.5) * laneHeight;
      const firingLane = typeof nodeLane === 'number' ? nodeLane : request.lane;
      const cannonCenterY = (firingLane + 0.5) * laneHeight;
      const cannonX = 210;
      const targetCustomer = entityManager.customers.find((c) => c.request.id === request.id);
      const targetX = targetCustomer ? targetCustomer.pixelX : rect.width - 100;
      const targetY = targetCustomer ? targetCustomer.pixelY : targetLaneCenterY;

      // Game lanes never dictate Kubernetes scheduling. The visual shot originates
      // from the node actually selected by the scheduler, even across lanes.
      soundEngine.playCannonFire();
      entityManager.spawnProjectile(firingLane, cannonX, cannonCenterY, targetX, targetY);

      setTimeout(() => {
        entityManager.spawnExplosionParticles(targetX, targetY, '#4FD1C5', 30);
        entityManager.spawnFloatingText(`+${points} XP`, targetX, targetY - 26, '#E3BC72');
        entityManager.spawnFloatingText('REQUEST SERVED!', targetX, targetY - 44, '#64D98B');
        entityManager.customers = entityManager.customers.filter((c) => c.request.id !== request.id);
      }, 320);
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
