export type GoalMode = 'diverse' | 'focused';

export interface EligibleProfile {
  id: string;
  major: string;
  year_of_study: number;
  interests: string[];
  personality: string;
}

export interface Weights {
  interest: number;
  major: number;
  year: number;
  personality: number;
}

export interface PaCSConfig {
  goal_mode: GoalMode;
  num_worlds: number;
  num_cycles: number;
  lead_percent: number;
  mutation_rate: number;
  plateau_epsilon: number;
  plateau_patience: number;
  min_group_size: number;
  max_group_size: number;
  weights: Weights;
}

export interface GroupScoreBreakdown {
  interestOverlap: number;
  majorFactor: number;
  yearProximity: number;
  personalityBalance: number;
  total: number;
}

export interface ScoredGroup {
  memberIds: string[];
  score: GroupScoreBreakdown;
}

export interface WorldEvaluation {
  groups: ScoredGroup[];
  worldScore: number;
}

export interface PaCSRunResult {
  cyclesExecuted: number;
  bestWorldScore: number;
  averageWorldScore: number;
  bestWorld: WorldEvaluation;
}

export type PersonalityCompatibilityMap = Map<string, number>;
