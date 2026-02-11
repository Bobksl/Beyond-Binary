import { runPaCS } from '../supabase/functions/pacs-grouping/pacs.ts';

const seededRng = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

const generateProfiles = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `sim-user-${i + 1}`,
    major: ['Computer Science', 'Business', 'Economics', 'Psychology'][i % 4],
    year_of_study: (i % 4) + 1,
    interests: i % 2 === 0 ? ['AI', 'Data', 'Web'] : ['Finance', 'Policy', 'Data'],
    personality: ['Analytical', 'Collaborative', 'Creative', 'Practical'][i % 4],
  }));

const config = {
  goal_mode: 'diverse',
  num_worlds: 30,
  num_cycles: 20,
  lead_percent: 0.05,
  mutation_rate: 0.2,
  plateau_epsilon: 0.0001,
  plateau_patience: 4,
  min_group_size: 4,
  max_group_size: 5,
  weights: {
    interest: 0.35,
    major: 0.25,
    year: 0.2,
    personality: 0.2,
  },
};

const run = () => {
  const profiles = generateProfiles(40);
  const result = runPaCS(profiles, config, new Map(), seededRng(123));

  console.log('PaCS simulation summary');
  console.log('-----------------------');
  console.log(`Profiles: ${profiles.length}`);
  console.log(`Cycles executed: ${result.cyclesExecuted}`);
  console.log(`Best world score: ${result.bestWorldScore.toFixed(4)}`);
  console.log(`Average world score: ${result.averageWorldScore.toFixed(4)}`);
  console.log(`Final groups: ${result.bestWorld.groups.length}`);
};

run();
