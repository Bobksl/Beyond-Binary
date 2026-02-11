import { scoreGroup } from './scoring.ts';
import type {
  EligibleProfile,
  PaCSConfig,
  PaCSRunResult,
  PersonalityCompatibilityMap,
  ScoredGroup,
  WorldEvaluation,
} from './types.ts';

const randomInt = (maxExclusive: number, rng: () => number): number =>
  Math.floor(rng() * maxExclusive);

const shuffle = <T>(input: T[], rng: () => number): T[] => {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const computeGroupSizes = (total: number, minSize: number, maxSize: number): number[] => {
  const memo = new Map<number, number[] | null>();

  const dfs = (remaining: number): number[] | null => {
    if (remaining === 0) return [];
    if (remaining < minSize) return null;
    if (memo.has(remaining)) return memo.get(remaining) ?? null;

    for (let size = maxSize; size >= minSize; size -= 1) {
      if (remaining - size < 0) continue;
      const rest = dfs(remaining - size);
      if (rest) {
        const solution = [size, ...rest];
        memo.set(remaining, solution);
        return solution;
      }
    }

    memo.set(remaining, null);
    return null;
  };

  const result = dfs(total);
  if (!result) {
    throw new Error(
      `Cannot partition ${total} users into group sizes between ${minSize} and ${maxSize}.`
    );
  }
  return result;
};

export const buildRandomWorld = (
  userIds: string[],
  minSize: number,
  maxSize: number,
  rng: () => number
): string[][] => {
  const sizes = computeGroupSizes(userIds.length, minSize, maxSize);
  const shuffled = shuffle(userIds, rng);
  const groups: string[][] = [];

  let cursor = 0;
  for (const size of sizes) {
    groups.push(shuffled.slice(cursor, cursor + size));
    cursor += size;
  }

  return groups;
};

export const evaluateWorld = (
  groups: string[][],
  byId: Map<string, EligibleProfile>,
  config: PaCSConfig,
  compatibilityMap: PersonalityCompatibilityMap
): WorldEvaluation => {
  const scoredGroups: ScoredGroup[] = groups.map((memberIds) => {
    const members = memberIds
      .map((id) => byId.get(id))
      .filter((member): member is EligibleProfile => Boolean(member));

    return {
      memberIds,
      score: scoreGroup(members, config.goal_mode, config.weights, compatibilityMap),
    };
  });

  const worldScore =
    scoredGroups.length > 0
      ? scoredGroups.reduce((sum, group) => sum + group.score.total, 0) / scoredGroups.length
      : 0;

  return { groups: scoredGroups, worldScore };
};

type LeadSnapshot = {
  memberIds: string[];
};

const selectLeadSnapshots = (evaluations: WorldEvaluation[], leadPercent: number): LeadSnapshot[] => {
  const ranked = evaluations
    .flatMap((world) => world.groups)
    .sort((a, b) => b.score.total - a.score.total);

  if (ranked.length === 0) return [];

  const target = Math.max(1, Math.floor(ranked.length * leadPercent));
  const selected: LeadSnapshot[] = [];
  const used = new Set<string>();

  for (const group of ranked) {
    const overlaps = group.memberIds.some((id) => used.has(id));
    if (overlaps) continue;
    selected.push({ memberIds: [...group.memberIds] });
    for (const id of group.memberIds) used.add(id);
    if (selected.length >= target) break;
  }

  if (selected.length < target) {
    for (const group of ranked) {
      if (selected.some((existing) => existing.memberIds.join('|') === group.memberIds.join('|'))) {
        continue;
      }
      selected.push({ memberIds: [...group.memberIds] });
      if (selected.length >= target) break;
    }
  }

  return selected;
};

const mutateNonLeadGroups = (
  groups: string[][],
  lockedGroupCount: number,
  mutationRate: number,
  rng: () => number
): string[][] => {
  const next = groups.map((group) => [...group]);
  const mutableIndices = next
    .map((_, index) => index)
    .filter((index) => index >= lockedGroupCount && next[index].length > 0);

  if (mutableIndices.length < 2 || mutationRate <= 0) return next;

  const mutableMembers = mutableIndices.reduce((sum, index) => sum + next[index].length, 0);
  const swapCount = Math.max(0, Math.floor(mutableMembers * mutationRate));

  for (let i = 0; i < swapCount; i += 1) {
    const firstGroupIndex = mutableIndices[randomInt(mutableIndices.length, rng)];
    let secondGroupIndex = mutableIndices[randomInt(mutableIndices.length, rng)];
    if (secondGroupIndex === firstGroupIndex) {
      secondGroupIndex = mutableIndices[(mutableIndices.indexOf(firstGroupIndex) + 1) % mutableIndices.length];
    }

    const firstGroup = next[firstGroupIndex];
    const secondGroup = next[secondGroupIndex];
    if (firstGroup.length === 0 || secondGroup.length === 0) continue;

    const i1 = randomInt(firstGroup.length, rng);
    const i2 = randomInt(secondGroup.length, rng);
    [firstGroup[i1], secondGroup[i2]] = [secondGroup[i2], firstGroup[i1]];
  }

  return next;
};

const evolveWorld = (
  allUserIds: string[],
  leadSnapshots: LeadSnapshot[],
  config: PaCSConfig,
  rng: () => number
): string[][] => {
  const canPartition = (count: number) => {
    try {
      computeGroupSizes(count, config.min_group_size, config.max_group_size);
      return true;
    } catch {
      return false;
    }
  };

  let leadGroups = leadSnapshots.map((lead) => [...lead.memberIds]);
  let lockedUsers = new Set(leadGroups.flat());
  let remaining = allUserIds.filter((id) => !lockedUsers.has(id));

  while (leadGroups.length > 0 && !canPartition(remaining.length)) {
    leadGroups = leadGroups.slice(0, -1);
    lockedUsers = new Set(leadGroups.flat());
    remaining = allUserIds.filter((id) => !lockedUsers.has(id));
  }

  const randomGroups = remaining.length
    ? buildRandomWorld(remaining, config.min_group_size, config.max_group_size, rng)
    : [];

  const combined = [...leadGroups, ...randomGroups];
  return mutateNonLeadGroups(combined, leadGroups.length, config.mutation_rate, rng);
};

export const runPaCS = (
  profiles: EligibleProfile[],
  config: PaCSConfig,
  compatibilityMap: PersonalityCompatibilityMap,
  rng: () => number = Math.random
): PaCSRunResult => {
  if (!profiles.length) {
    throw new Error('No eligible profiles were found.');
  }

  const userIds = profiles.map((profile) => profile.id);
  computeGroupSizes(userIds.length, config.min_group_size, config.max_group_size);

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  let worlds: string[][][] = Array.from({ length: config.num_worlds }, () =>
    buildRandomWorld(userIds, config.min_group_size, config.max_group_size, rng)
  );

  let bestWorldEval: WorldEvaluation | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let avgScore = 0;
  let cyclesExecuted = 0;
  let plateauCount = 0;
  let previousBest = Number.NEGATIVE_INFINITY;

  for (let cycle = 0; cycle < config.num_cycles; cycle += 1) {
    const evaluations = worlds.map((world) => evaluateWorld(world, byId, config, compatibilityMap));
    const cycleBest = evaluations.reduce((best, current) =>
      current.worldScore > best.worldScore ? current : best
    );
    const cycleAvg = evaluations.reduce((sum, w) => sum + w.worldScore, 0) / evaluations.length;

    if (cycleBest.worldScore > bestScore) {
      bestScore = cycleBest.worldScore;
      bestWorldEval = cycleBest;
    }

    avgScore = cycleAvg;
    cyclesExecuted = cycle + 1;

    if (cycleBest.worldScore - previousBest < config.plateau_epsilon) {
      plateauCount += 1;
    } else {
      plateauCount = 0;
    }
    previousBest = cycleBest.worldScore;

    if (plateauCount >= config.plateau_patience || cycle === config.num_cycles - 1) {
      break;
    }

    const leads = selectLeadSnapshots(evaluations, config.lead_percent);
    worlds = Array.from({ length: config.num_worlds }, () => evolveWorld(userIds, leads, config, rng));
  }

  if (!bestWorldEval) {
    throw new Error('PaCS did not produce a valid world evaluation.');
  }

  return {
    cyclesExecuted,
    bestWorldScore: bestScore,
    averageWorldScore: avgScore,
    bestWorld: bestWorldEval,
  };
};
