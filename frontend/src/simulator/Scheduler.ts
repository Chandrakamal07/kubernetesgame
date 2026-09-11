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

export class KubeScheduler {
  /**
   * Evaluates candidate nodes for a pending pod and assigns the best fit.
   */
  public evaluateNodes(pod: K8sPod, nodes: K8sNode[]): SchedulerDecision {
    const evaluations: SchedulerDecision['evaluations'] = [];
    const eligibleNodes: { node: K8sNode; score: number }[] = [];

    for (const node of nodes) {
      if (node.role !== 'worker') {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node is Control Plane / Master (no worker workloads)',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 }
        });
        continue;
      }

      if (node.status !== 'Ready') {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: 'Node status is NotReady',
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 }
        });
        continue;
      }

      // Check CPU capacity
      const freeCpu = node.cpuCapacity - node.cpuAllocated;
      if (freeCpu < pod.cpuRequest) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient CPU: requested ${pod.cpuRequest} cores, free ${freeCpu.toFixed(2)} cores`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 }
        });
        continue;
      }

      // Check Memory capacity
      const freeMemory = node.memoryCapacity - node.memoryAllocated;
      if (freeMemory < pod.memoryRequest) {
        evaluations.push({
          nodeName: node.name,
          passedFilter: false,
          filterReason: `Insufficient Memory: requested ${pod.memoryRequest}Mi, free ${freeMemory}Mi`,
          score: 0,
          scoreBreakdown: { cpuScore: 0, memoryScore: 0, totalScore: 0 }
        });
        continue;
      }

      // Scoring: Kubernetes LeastRequestedPriority / Balanced Resource Allocation
      const cpuFraction = (freeCpu - pod.cpuRequest) / node.cpuCapacity;
      const memoryFraction = (freeMemory - pod.memoryRequest) / node.memoryCapacity;
      
      const cpuScore = Math.round(cpuFraction * 50);
      const memoryScore = Math.round(memoryFraction * 50);
      const totalScore = cpuScore + memoryScore;

      evaluations.push({
        nodeName: node.name,
        passedFilter: true,
        score: totalScore,
        scoreBreakdown: { cpuScore, memoryScore, totalScore }
      });

      eligibleNodes.push({ node, score: totalScore });
    }

    if (eligibleNodes.length === 0) {
      return {
        selectedNode: null,
        evaluations,
        reason: '0/3 nodes are available: Insufficient resources or nodes NotReady'
      };
    }

    // Sort descending by score
    eligibleNodes.sort((a, b) => b.score - a.score);
    const selected = eligibleNodes[0].node;

    return {
      selectedNode: selected,
      evaluations,
      reason: `Successfully scheduled pod ${pod.name} to ${selected.name} (Score: ${eligibleNodes[0].score}/100)`
    };
  }
}
