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

    const unsubscribeSatisfying = eventBus.on('REQUEST_SATISFYING', ({ requestId, request, fulfillingNode }) => {
      const rect = canvas.getBoundingClientRect();
      const laneHeight = rect.height / 3;

      // 1. Mark target customer as satisfying in EntityManager (freezes motion and SLA countdown)
      const targetCustomer = entityManager.customers.find((c) => c.request.id === requestId);
      if (targetCustomer) {
        targetCustomer.status = 'satisfying';
      }

      // 2. Firing origin comes from host fulfilling node
      const originLane = fulfillingNode ? fulfillingNode.laneIndex : request.lane;
      const targetLane = request.lane;

      const originCenterY = (originLane + 0.5) * laneHeight;
      const targetCenterY = (targetLane + 0.5) * laneHeight;
      const cannonX = 200;
      const targetX = targetCustomer ? targetCustomer.pixelX : rect.width - 120;

      // 3. Aim fulfilling node cannon barrel diagonally toward target
      const hostNode = cluster.nodes.find((n) => n.laneIndex === originLane) || cluster.nodes[0];
      if (hostNode) {
        hostNode.turretAngle = Math.atan2(targetCenterY - originCenterY, targetX - cannonX);
        hostNode.lastFiredTimestamp = Date.now();
      }

      // 4. Play cannon sound and emit CANNON_FIRED
      soundEngine.playCannonFire();
      eventBus.emit('CANNON_FIRED', {
        requestId,
        nodeName: hostNode?.name || 'worker-1',
        originLane,
        targetLane,
      });

      // 5. Spawn projectile traveling diagonally across lanes
      entityManager.spawnProjectile(
        requestId,
        hostNode?.name || 'worker-1',
        originLane,
        targetLane,
        cannonX,
        originCenterY,
        targetX,
        targetCenterY
      );

      // 6. Reset turret angle after brief firing duration
      setTimeout(() => {
        if (hostNode) hostNode.turretAngle = 0;
      }, 450);
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
        // Retain active and satisfying customers; remove hit / reached_node entities
        entityManager.customers = entityManager.customers.filter((c) => c.status === 'active' || c.status === 'satisfying');
      }

      renderer.render(dt, cluster.nodes, entityManager, activeRequestRef.current?.lane ?? null, isPaused);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      unsubscribeSpawn();
      unsubscribeSatisfying();
    };
  }, [cluster.nodes, isPaused, actions]);

  return (
    <div data-tutorial="battlefield" className="relative w-full h-full min-h-[300px] bg-[#060810] overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
