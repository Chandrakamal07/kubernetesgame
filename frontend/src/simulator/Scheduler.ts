import type { K8sNode, K8sPod, Taint, Toleration } from './types.ts';
import { formatCpu, formatMemory } from './imageUtils.ts';

export interface NodeEvaluation {
  nodeName: string;
  passedFilter: boolean;
  filterReason?: string;
  score: number;
  scoreBreakdown: {
    cpuScore: number;
    memoryScore: number;
    totalScore: number;
  };
}

export interface SchedulerDecision {
  selectedNode: K8sNode | null;
  evaluations: NodeEvaluation[];
  reason: string;
}

export class KubeScheduler {
  /**
   * Checks if a pod tolerates a node's taint.
   */
  private toleratesTaint(podTolerations: Toleration[] | undefined, taint: Taint): boolean {
    if (!podTolerations || podTolerations.length === 0) return false;

    return podTolerations.some((tol) => {
      // Exists operator matches any key/value if key matches, or matches all if key is empty
      if (tol.operator === 'Exists') {
        if (!tol.key) return true; // matches everything
        return tol.key === taint.key && (!tol.effect || tol.effect === taint.effect);
      }

      // Equal operator (default)
      const keyMatches = tol.key === taint.key;
      const valueMatches = tol.value === taint.value || (!tol.value && !taint.value);
      const effectMatches = !tol.effect || tol.effect === taint.effect;

      return keyMatches && valueMatches && effectMatches;
    });
  }

  /**
   * Evaluates candidate nodes for an unscheduled pod according to Kubernetes scheduling pipeline:
   * 1. FILTERING (Predicates): NodeReady, Unschedulable check, Taints & Tolerations, NodeResourcesFit (Allocatable).
   * 2. SCORING (Priorities): Simplified NodeResourcesFit / LeastAllocated scoring formula.
   */
  public evaluateNodes(pod: K8sPod, nodes: K8sNode[]): SchedulerDecision {
    const evaluations: NodeEvaluation[] = [];
    const eligibleNodes: { node: K8sNode; score: number }[] = [];

    const reqCpu = pod.resources.requests?.cpu ?? 0.25;
    const reqMem = pod.resources.requests?.memory ?? 256;

    for (const node of nodes) {
      // Filter 1: Node Ready Check
      if (node.status !== 'Ready') {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node is NotReady (kubelet heartbeat/status not ready)',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      // Filter 2: Node Unschedulable (e.g. cordoned/drained)
      if (node.unschedulable) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node is marked unschedulable (cordoned or draining)',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      // Filter 3: Taints & Tolerations
      if (node.taints && node.taints.length > 0) {
        const untoleratedTaint = node.taints.find(
          (t) => (t.effect === 'NoSchedule' || t.effect === 'NoExecute') && !this.toleratesTaint(pod.tolerations, t)
        );

        if (untoleratedTaint) {
          evaluations.push({
            nodeName: node.name,
            passedFilter: false,
            filterReason: `Node has taint {${untoleratedTaint.key}: ${untoleratedTaint.effect}} that pod does not tolerate`,
            score: 0,
            scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
          });
          continue;
        }
      }

      // Filter 4: Node Allocatable Resources Fit
      // Scheduling compares against Node Allocatable, NOT raw Capacity.
      const freeCpu = node.cpuAllocatable - node.cpuRequested;
      if (freeCpu < reqCpu) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient CPU: requested ${formatCpu(reqCpu)}, available allocatable ${formatCpu(Math.max(0, freeCpu))}`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      const freeMem = node.memoryAllocatable - node.memoryRequested;
      if (freeMem < reqMem) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient Memory: requested ${formatMemory(reqMem)}, available allocatable ${formatMemory(Math.max(0, freeMem))}`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      // Scoring Stage: Simplified NodeResourcesFit / LeastAllocated Priority
      // Higher score awarded to nodes where the placement leaves a balanced, healthy ratio of remaining allocatable capacity.
      const cpuFreeRatio = Math.max(0, (freeCpu - reqCpu) / node.cpuAllocatable);
      const memFreeRatio = Math.max(0, (freeMem - reqMem) / node.memoryAllocatable);

      const cpuScore = Math.round(cpuFreeRatio * 50);
      const memoryScore = Math.round(memFreeRatio * 50);
      const totalScore = cpuScore + memoryScore;

      evaluations.push({
        nodeName: node.name,
        passedFilter: true,
        score: totalScore,
        scoreBreakdown: { cpuScore, memoryScore, totalScore },
      });

      eligibleNodes.push({ node, score: totalScore });
    }

    if (eligibleNodes.length === 0) {
      const reasons = evaluations.map((e) => `${e.nodeName}: ${e.filterReason || 'OK'}`).join(', ');
      return {
        selectedNode: null,
        evaluations,
        reason: `0/${nodes.length} nodes are available: ${reasons}`,
      };
    }

    // Sort descending by score; break ties deterministically by node name
    eligibleNodes.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.node.name.localeCompare(b.node.name);
    });

    const selected = eligibleNodes[0].node;

    return {
      selectedNode: selected,
      evaluations,
      reason: `Successfully scheduled pod ${pod.name} to ${selected.name} (LeastAllocated Score: ${eligibleNodes[0].score}/100)`,
    };
  }
}
