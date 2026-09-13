import type { K8sNode } from '../simulator/types';

export type LearningMode = 'LEARN' | 'PRACTICE' | 'CHALLENGE';

export interface ConceptDefinition {
  term: string;
  plainMeaning: string;
  technicalMeaning: string;
  analogy?: string;
}

export type CommandSegmentCategory = 
  | 'tool' 
  | 'verb' 
  | 'resource' 
  | 'name' 
  | 'flag' 
  | 'value';

export interface CommandSegment {
  token: string;
  meaning: string;
  category: CommandSegmentCategory;
}

export type ObjectiveKind = 'COMMAND' | 'STATE' | 'OBSERVATION' | 'INTERACTION';

export type ObjectiveType = 
  | 'inspect-nodes' 
  | 'inspect-pods'
  | 'inspect-pods-wide' 
  | 'describe-node' 
  | 'describe-pod'
  | 'create-pod' 
  | 'delete-pod'
  | 'failed-scheduling'
  | 'inspect-cluster-components'
  | 'concept-review';

export interface MissionCompletionRule {
  type: ObjectiveType;
  kind?: ObjectiveKind;
  podName?: string;
  image?: string;
  nodeName?: string;
  minCpu?: number; // In cores, e.g. 0.5
  minMem?: number; // In Mi, e.g. 1024
  requireReady?: boolean; // Pod must be Running & Ready
  manifestFile?: string;
}

export type VisualEffectType = 
  | 'SCAN' 
  | 'DEPLOY' 
  | 'DIAGNOSE' 
  | 'CLEANUP' 
  | 'VERIFY';

export type MissionStatus = 
  | 'NOT_STARTED' 
  | 'TEACHING' 
  | 'ACTIVE' 
  | 'RESOLVING' 
  | 'COMPLETED' 
  | 'FAILED_RETRYABLE' 
  | 'SKIPPED';

export interface RequiredInputItem {
  label: string;
  value: string;
  explanation: string;
}

export interface LessonMission {
  id: string;
  lessonNumber: number;
  title: string;
  subtitle: string;
  lane: number; // 0, 1, 2 for visual battlefield positioning
  teach: {
    summary: string;
    concepts: ConceptDefinition[];
    whyThisMatters: string;
  };
  goal: {
    plainLanguage: string;
    requiredInputs: RequiredInputItem[];
  };
  guidedCommand?: {
    fullCommand: string;
    segments: CommandSegment[];
  };
  verification: {
    command?: string;
    expectedObservation: string;
  };
  completionRule: MissionCompletionRule;
  gameEffect: VisualEffectType;
  review: {
    whatHappened: string[];
    keyTakeaway: string;
  };
  hints: [string, string, string, string]; // 4 progressive hint tiers
  timeToImpactSeconds?: number; // Active ONLY in Challenge mode
  basePoints: number;
}

// Backward-compatibility alias for ScenarioRequest
export type ScenarioRequest = LessonMission;
export type CustomerRequirement = MissionCompletionRule;
export type RequestStatus = 
  | 'PENDING' 
  | 'ACTIVE' 
  | 'SATISFYING' 
  | 'SERVED' 
  | 'BREACHED' 
  | 'FAILED';

export interface LevelConfig {
  id: number;
  chapterId: number;
  title: string;
  subtitle: string;
  description: string;
  initialNodes: K8sNode[];
  missions: LessonMission[];
  // Compatibility alias
  requests?: LessonMission[];
  learningOutcomes: string[];
}

export interface ChapterConfig {
  id: number;
  title: string;
  description: string;
  badge: string;
  unlocked: boolean;
  isComingSoon?: boolean;
  levels: LevelConfig[];
}

export interface PersistedProgressV1 {
  version: 1;
  mode: LearningMode;
  completedLessonIds: string[];
  bestScores: Record<string, number>;
  preferences: {
    muted: boolean;
    reducedMotion: boolean;
    terminalExpanded: boolean;
  };
  lastOpenedLessonId?: string;
}
