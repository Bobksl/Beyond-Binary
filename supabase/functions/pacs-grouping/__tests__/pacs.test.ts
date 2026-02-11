import { describe, expect, it } from 'vitest';
import { runPaCS } from '../pacs.ts';
import { EligibleProfile, PaCSConfig } from '../types.ts';

const seededRng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const makeProfiles = (count: number): EligibleProfile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    major: i % 3 === 0 ? 'Computer Science' : i % 3 === 1 ? 'Business' : 'Economics',
    year_of_study: (i % 4) + 1,
    interests: i % 2 === 0 ? ['AI', 'Web', 'Data'] : ['Finance', 'Policy', 'Data'],
    personality: i % 4 === 0 ? 'Analytical' : i % 4 === 1 ? 'Collaborative' : i % 4 === 2 ? 'Creative' : 'Practical',
  }));

const config: PaCSConfig = {
  goal_mode: 'diverse',
  num_worlds: 10,
  num_cycles: 6,
  lead_percent: 0.1,
  mutation_rate: 0.2,
  plateau_epsilon: 0,
  plateau_patience: 10,
  min_group_size: 4,
  max_group_size: 5,
  weights: {
    interest: 0.35,
    major: 0.25,
    year: 0.2,
    personality: 0.2,
  },
};

describe('PaCS', () => {
  it('creates valid groups where each user appears exactly once in best world', () => {
    const profiles = makeProfiles(20);
    const result = runPaCS(profiles, config, new Map(), seededRng(42));

    expect(result.bestWorld.groups.length).toBeGreaterThan(0);
    expect(result.bestWorldScore).toBeGreaterThanOrEqual(0);
    expect(result.bestWorldScore).toBeLessThanOrEqual(1);

    const seen = new Set<string>();
    for (const group of result.bestWorld.groups) {
      expect(group.memberIds.length >= 4 && group.memberIds.length <= 5).toBe(true);
      for (const id of group.memberIds) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }

    expect(seen.size).toBe(profiles.length);
  });
});
