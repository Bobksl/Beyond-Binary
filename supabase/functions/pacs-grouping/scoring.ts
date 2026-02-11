import type {
  EligibleProfile,
  GoalMode,
  GroupScoreBreakdown,
  PersonalityCompatibilityMap,
  Weights,
} from './types.ts';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const pairKey = (a: string, b: string) => `${a}::${b}`;

export const buildCompatibilityMap = (
  rows: Array<{ p1: string; p2: string; score: number }>
): PersonalityCompatibilityMap => {
  const map: PersonalityCompatibilityMap = new Map();
  for (const row of rows) {
    map.set(pairKey(row.p1, row.p2), Number(row.score));
  }
  return map;
};

export const jaccardSimilarity = (a: string[] = [], b: string[] = []): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount += 1;
  }
  return intersectionCount / union.size;
};

export const computeInterestOverlap = (members: EligibleProfile[]): number => {
  if (members.length < 2) return 0;
  let total = 0;
  let pairs = 0;

  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      total += jaccardSimilarity(members[i].interests, members[j].interests);
      pairs += 1;
    }
  }

  return pairs > 0 ? total / pairs : 0;
};

export const computeMajorFactor = (members: EligibleProfile[], goalMode: GoalMode): number => {
  if (members.length === 0) return 0;
  const freq = new Map<string, number>();
  for (const member of members) {
    freq.set(member.major, (freq.get(member.major) ?? 0) + 1);
  }

  if (goalMode === 'diverse') {
    return freq.size / members.length;
  }

  let maxCount = 0;
  for (const count of freq.values()) {
    maxCount = Math.max(maxCount, count);
  }
  return maxCount / members.length;
};

export const computeYearProximity = (members: EligibleProfile[], alpha = 0.75): number => {
  if (members.length === 0) return 0;
  const values = members.map((m) => Number(m.year_of_study)).filter((v) => Number.isFinite(v));
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return Math.exp(-alpha * stdDev);
};

export const computePersonalityBalance = (
  members: EligibleProfile[],
  compatibilityMap: PersonalityCompatibilityMap,
  neutralScore = 0.5
): number => {
  if (members.length < 2) return clamp01(neutralScore);

  let total = 0;
  let pairs = 0;

  for (let i = 0; i < members.length; i += 1) {
    for (let j = i + 1; j < members.length; j += 1) {
      const a = members[i].personality;
      const b = members[j].personality;

      const direct = compatibilityMap.get(pairKey(a, b));
      const reverse = compatibilityMap.get(pairKey(b, a));
      const value = direct ?? reverse ?? neutralScore;
      total += clamp01(value);
      pairs += 1;
    }
  }

  return pairs > 0 ? total / pairs : clamp01(neutralScore);
};

export const normalizeWeights = (weights: Weights): Weights => {
  const safe = {
    interest: Math.max(0, Number(weights.interest)),
    major: Math.max(0, Number(weights.major)),
    year: Math.max(0, Number(weights.year)),
    personality: Math.max(0, Number(weights.personality)),
  };

  const total = safe.interest + safe.major + safe.year + safe.personality;
  if (total <= 0) {
    return { interest: 0.25, major: 0.25, year: 0.25, personality: 0.25 };
  }

  return {
    interest: safe.interest / total,
    major: safe.major / total,
    year: safe.year / total,
    personality: safe.personality / total,
  };
};

export const scoreGroup = (
  members: EligibleProfile[],
  goalMode: GoalMode,
  weights: Weights,
  compatibilityMap: PersonalityCompatibilityMap
): GroupScoreBreakdown => {
  const normalized = normalizeWeights(weights);
  const interestOverlap = clamp01(computeInterestOverlap(members));
  const majorFactor = clamp01(computeMajorFactor(members, goalMode));
  const yearProximity = clamp01(computeYearProximity(members));
  const personalityBalance = clamp01(computePersonalityBalance(members, compatibilityMap));

  const total =
    normalized.interest * interestOverlap +
    normalized.major * majorFactor +
    normalized.year * yearProximity +
    normalized.personality * personalityBalance;

  return {
    interestOverlap,
    majorFactor,
    yearProximity,
    personalityBalance,
    total: clamp01(total),
  };
};
