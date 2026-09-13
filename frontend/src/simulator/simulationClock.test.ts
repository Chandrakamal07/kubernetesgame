import test from 'node:test';
import assert from 'node:assert/strict';
import { SimulationClock } from './SimulationClock.ts';
import { ClusterSimulator } from './ClusterSimulator.ts';

test('SimulationClock Deterministic Virtual Clock Test Suite', async (t) => {
  await t.test('Scheduled actions execute only after virtual time advances', () => {
    const clock = new SimulationClock();
    let executed = false;

    clock.schedule(500, 'test-scope', () => {
      executed = true;
    });

    assert.equal(executed, false, 'Action should not execute before clock advances');

    clock.advance(200);
    assert.equal(executed, false, 'Action should not execute before due time');

    clock.advance(300);
    assert.equal(executed, true, 'Action should execute when virtual time reaches due timestamp');
  });

  await t.test('cancelScope removes all pending actions in that scope', () => {
    const clock = new SimulationClock();
    let executedA = false;
    let executedB = false;

    clock.schedule(500, 'pod:pod-123', () => {
      executedA = true;
    });

    clock.schedule(500, 'pod:pod-456', () => {
      executedB = true;
    });

    clock.cancelScope('pod:pod-123');
    clock.advance(1000);

    assert.equal(executedA, false, 'Action for cancelled scope should not execute');
    assert.equal(executedB, true, 'Action for active scope should execute normally');
  });

  await t.test('Pause halts virtual time advancement', () => {
    const clock = new SimulationClock();
    let executed = false;

    clock.schedule(300, 'global', () => {
      executed = true;
    });

    clock.setPaused(true);
    clock.advance(500);
    assert.equal(executed, false, 'Action must not execute while clock is paused');

    clock.setPaused(false);
    clock.advance(500);
    assert.equal(executed, true, 'Action executes after clock is resumed');
  });

  await t.test('Deleting a Pod before scheduling cancels callbacks and creates zero ghost Pods', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);

    // 1. Create Pod web-01
    const res = sim.createPod('web-01', 'nginx');
    assert.equal(res.success, true);
    assert.equal(sim.getState().pods.length, 1);
    assert.equal(sim.getState().pods[0].phase, 'Pending');

    // 2. Advance time partially (before scheduler runs at +450ms)
    clock.advance(200);
    assert.equal(sim.getState().pods[0].nodeName, null);

    // 3. Delete Pod before it is scheduled
    const delRes = sim.deletePod('web-01');
    assert.equal(delRes.success, true);
    assert.equal(sim.getState().pods.length, 0);

    // 4. Advance time past the original scheduling point (+5000ms)
    clock.advance(5000);

    // 5. Verify NO ghost pod was created or scheduled
    assert.equal(sim.getState().pods.length, 0, 'No ghost pod should exist after deletion');
    assert.equal(sim.getState().nodes[0].pods.length, 0, 'No ghost pod should be attached to node');
  });

  await t.test('Deleting a Pod during container creation cancels Ready transition and reclaims resources', () => {
    const clock = new SimulationClock();
    const sim = new ClusterSimulator(undefined, clock);

    // 1. Create Pod with 500m CPU request
    sim.createPod('compute-01', 'nginx', { requests: { cpu: 0.5, memory: 256 } });

    // 2. Advance clock to trigger scheduling (+500ms)
    clock.advance(500);

    const pod = sim.getState().pods.find((p) => p.name === 'compute-01');
    assert.ok(pod, 'Pod must exist');
    assert.ok(pod.nodeName, 'Pod must be scheduled to a node');
    assert.equal(pod.phase, 'Pending', 'Pod is still in Pending / ContainerCreating');

    const boundNode = sim.getState().nodes.find((n) => n.name === pod.nodeName);
    assert.ok(boundNode, 'Node must exist');
    assert.equal(boundNode.cpuRequested, 0.5, 'Node requested CPU must be 500m');

    // 3. Delete Pod during container creation
    sim.deletePod('compute-01');
    assert.equal(sim.getState().pods.length, 0);
    const updatedNode = sim.getState().nodes.find((n) => n.name === pod.nodeName);
    assert.ok(updatedNode, 'Node must exist');
    assert.equal(updatedNode.cpuRequested, 0, 'Node requested CPU must be immediately reclaimed');

    // 4. Advance clock way past container start (+5000ms)
    clock.advance(5000);

    // 5. Verify no ghost pod and no corrupt resource counters
    const finalNode = sim.getState().nodes.find((n) => n.name === pod.nodeName);
    assert.equal(sim.getState().pods.length, 0);
    assert.equal(finalNode?.cpuRequested, 0);
    assert.equal(finalNode?.pods.length, 0);
  });
});
