import type { K8sNode, K8sPod } from './types';

export interface SchedulerDecision {
  selectedNode: K8sNode | null;
  evaluations: {
    nodeName: string;
    passedFilter: boolean;
    filterReason?: string;
    score: number;
    scoreBreakdown: {
      cpuScore: number;
      memoryScore: number;
      totalScore: number;
    };
  }[];
  reason: string;
}

function hasBlockingNoScheduleTaint(node: K8sNode): boolean {
  return (node.taints || []).some((taint) => taint.effect === 'NoSchedule');
}

export class KubeScheduler {
  /**
   * Educational approximation of kube-scheduler filtering/scoring.
   * Game lanes and node roles are deliberately NOT scheduling constraints.
   */
  public evaluateNodes(pod: K8sPod, nodes: K8sNode[]): SchedulerDecision {
    const evaluations: SchedulerDecision['evaluations'] = [];
    const eligibleNodes: { node: K8sNode; score: number }[] = [];

    for (const node of nodes) {
      if (node.status !== 'Ready') {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node is NotReady',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      if (node.unschedulable) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node is cordoned (unschedulable)',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      if (hasBlockingNoScheduleTaint(node)) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Pod does not tolerate a NoSchedule taint on this node',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      const cpuAllocatable = node.cpuAllocatable ?? node.cpuCapacity;
      const memoryAllocatable = node.memoryAllocatable ?? node.memoryCapacity;
      const freeCpu = cpuAllocatable - node.cpuAllocated;
      const freeMemory = memoryAllocatable - node.memoryAllocated;

      if (freeCpu < pod.cpuRequest) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient CPU: requested ${pod.cpuRequest} cores, allocatable free ${freeCpu.toFixed(2)} cores`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      if (freeMemory < pod.memoryRequest) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient memory: requested ${pod.memoryRequest}Mi, allocatable free ${freeMemory}Mi`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 },
        });
        continue;
      }

      // Simplified LeastAllocated-style educational score. This is not a claim
      // that every Kubernetes cluster uses this exact scoring formula.
      const cpuFractionFreeAfter = Math.max(0, (freeCpu - pod.cpuRequest) / Math.max(cpuAllocatable, 0.001));
      const memoryFractionFreeAfter = Math.max(0, (freeMemory - pod.memoryRequest) / Math.max(memoryAllocatable, 1));
      const cpuScore = Math.round(cpuFractionFreeAfter * 50);
      const memoryScore = Math.round(memoryFractionFreeAfter * 50);
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
      const reasons = evaluations.map((e) => `${e.nodeName}: ${e.filterReason || 'filtered'}`).join('; ');
      return {
        selectedNode: null,
        evaluations,
        reason: `0/${nodes.length} nodes are available. ${reasons}`,
      };
    }

    eligibleNodes.sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name));
    const selected = eligibleNodes[0];

    return {
      selectedNode: selected.node,
      evaluations,
      reason: `Training scheduler selected ${selected.node.name} (simplified score ${selected.score}/100)`,
    };
  }
}
