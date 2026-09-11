import type { K8sNode } from '../simulator/types';

export type CustomerType = 
  | 'normal' 
  | 'urgent' 
  | 'heavy' 
  | 'memory-hog' 
  | 'cpu-burner' 
  | 'escalation';

export type ObjectiveKind = 'COMMAND' | 'STATE' | 'OBSERVATION';

export type ObjectiveType = 
  | 'inspect-nodes' 
  | 'inspect-pods-wide' 
  | 'describe-node' 
  | 'describe-pod'
  | 'create-pod' 
  | 'delete-pod'
  | 'failed-scheduling';

export interface CustomerRequirement {
  type: ObjectiveType;
  kind?: ObjectiveKind;
  podName?: string;
  image?: string;
  nodeName?: string;
  minCpu?: number;
  minMem?: number;
  requireReady?: boolean; // Pod must be in Running & Ready state
  manifestFile?: string;
}

export interface ScenarioRequest {
  id: string;
  customerName: string;
  customerRole: string;
  characterType: CustomerType;
  title: string;
  description: string;
  requirements: CustomerRequirement;
  lane: number; // 0, 1, 2 (Visual battlefield lane)
  slaTimeSeconds: number;
  rewardPoints: number;
  hints: [string, string, string, string]; // 4 progressive hint tiers
  learningNote: string;
}

export interface LevelConfig {
  id: number;
  chapterId: number;
  title: string;
  subtitle: string;
  description: string;
  initialNodes: K8sNode[];
  requests: ScenarioRequest[];
  learningOutcomes: string[];
}

export interface ChapterConfig {
  id: number;
  title: string;
  description: string;
  badge: string;
  unlocked: boolean;
  levels: LevelConfig[];
}
