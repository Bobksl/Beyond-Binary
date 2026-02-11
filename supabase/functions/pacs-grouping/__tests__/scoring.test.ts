import { describe, expect, it } from 'vitest';
import {
  computeMajorFactor,
  jaccardSimilarity,
  normalizeWeights,
  scoreGroup,
} from '../scoring.ts';
import { EligibleProfile } from '../types.ts';

const members: EligibleProfile[] = [
  {
    id: 'u1',
    major: 'Computer Science',
    year_of_study: 2,
    interests: ['AI', 'ML', 'Web'],
    personality: 'Analytical',
  },
  {
    id: 'u2',
    major: 'Computer Science',
    year_of_study: 2,
    interests: ['AI', 'Cybersecurity'],
    personality: 'Collaborative',
  },
  {
    id: 'u3',
    major: 'Business',
    year_of_study: 3,
    interests: ['Finance', 'Web'],
    personality: 'Creative',
  },
  {
    id: 'u4',
    major: 'Economics',
    year_of_study: 3,
    interests: ['Finance', 'Policy'],
    personality: 'Practical',
  },
];

describe('scoring', () => {
  it('computes jaccard similarity', () => {
    expect(jaccardSimilarity(['A', 'B'], ['B', 'C'])).toBeCloseTo(1 / 3, 5);
  });

  it('supports major diverse/focused modes', () => {
    const diverse = computeMajorFactor(members, 'diverse');
    const focused = computeMajorFactor(members, 'focused');
    expect(diverse).toBeGreaterThan(0);
    expect(focused).toBeGreaterThan(0);
    expect(focused).toBeCloseTo(0.5, 5);
  });

  it('normalizes weights safely', () => {
    const normalized = normalizeWeights({ interest: 6, major: 3, year: 2, personality: 1 });
    const sum = normalized.interest + normalized.major + normalized.year + normalized.personality;
    expect(sum).toBeCloseTo(1, 6);
  });

  it('produces bounded score values', () => {
    const score = scoreGroup(
      members,
      'diverse',
      { interest: 0.35, major: 0.25, year: 0.2, personality: 0.2 },
      new Map()
    );

    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(1);
  });
});
