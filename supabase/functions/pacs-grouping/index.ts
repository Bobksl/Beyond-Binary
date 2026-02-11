import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildCompatibilityMap } from './scoring.ts';
import { runPaCS } from './pacs.ts';
import { PaCSConfig, Weights } from './types.ts';

type GroupingConfigRow = {
  goal_mode: 'diverse' | 'focused';
  num_worlds: number;
  num_cycles: number;
  lead_percent: number;
  mutation_rate: number;
  plateau_epsilon: number;
  plateau_patience: number;
  min_group_size: number;
  max_group_size: number;
  weight_interest: number;
  weight_major: number;
  weight_year: number;
  weight_personality: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sanitizeWeights = (weights: Partial<Weights> | undefined, fallback: Weights): Weights => ({
  interest: Number.isFinite(Number(weights?.interest)) ? Math.max(0, Number(weights?.interest)) : fallback.interest,
  major: Number.isFinite(Number(weights?.major)) ? Math.max(0, Number(weights?.major)) : fallback.major,
  year: Number.isFinite(Number(weights?.year)) ? Math.max(0, Number(weights?.year)) : fallback.year,
  personality: Number.isFinite(Number(weights?.personality)) ? Math.max(0, Number(weights?.personality)) : fallback.personality,
});

const buildConfig = (row: GroupingConfigRow, overrides: Record<string, unknown> = {}): PaCSConfig => {
  const baseWeights: Weights = {
    interest: Number(row.weight_interest),
    major: Number(row.weight_major),
    year: Number(row.weight_year),
    personality: Number(row.weight_personality),
  };

  const overrideWeights = typeof overrides.weights === 'object' && overrides.weights !== null
    ? (overrides.weights as Partial<Weights>)
    : undefined;

  return {
    goal_mode:
      overrides.goal_mode === 'focused' || overrides.goal_mode === 'diverse'
        ? overrides.goal_mode
        : row.goal_mode,
    num_worlds: clamp(Number(overrides.num_worlds ?? row.num_worlds), 1, 500),
    num_cycles: clamp(Number(overrides.num_cycles ?? row.num_cycles), 1, 500),
    lead_percent: clamp(Number(overrides.lead_percent ?? row.lead_percent), 0.01, 0.5),
    mutation_rate: clamp(Number(overrides.mutation_rate ?? row.mutation_rate), 0, 1),
    plateau_epsilon: clamp(Number(overrides.plateau_epsilon ?? row.plateau_epsilon), 0, 1),
    plateau_patience: clamp(Number(overrides.plateau_patience ?? row.plateau_patience), 1, 50),
    min_group_size: clamp(Number(overrides.min_group_size ?? row.min_group_size), 2, 10),
    max_group_size: clamp(Number(overrides.max_group_size ?? row.max_group_size), 2, 10),
    weights: sanitizeWeights(overrideWeights, baseWeights),
  };
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed. Use POST.' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    const configOverrides =
      body && typeof body.config_overrides === 'object' && body.config_overrides !== null
        ? (body.config_overrides as Record<string, unknown>)
        : {};
    const createdBy = typeof body?.created_by === 'string' ? body.created_by : null;

    const { data: cfgRows, error: cfgError } = await supabase
      .from('grouping_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    if (cfgError) throw cfgError;
    if (!cfgRows?.length) throw new Error('No active grouping_config row found.');

    const config = buildConfig(cfgRows[0] as GroupingConfigRow, configOverrides);

    const { data: profiles, error: profilesError } = await supabase.rpc('get_eligible_profiles');
    if (profilesError) throw profilesError;
    if (!profiles || profiles.length < config.min_group_size) {
      throw new Error('Not enough eligible profiles to form groups.');
    }

    const { data: compatRows, error: compatError } = await supabase
      .from('personality_compatibility')
      .select('p1,p2,score');
    if (compatError) throw compatError;
    const compatibilityMap = buildCompatibilityMap((compatRows ?? []).map((row) => ({
      p1: String(row.p1),
      p2: String(row.p2),
      score: Number(row.score),
    })));

    const { data: runRow, error: runInsertError } = await supabase
      .from('group_runs')
      .insert({
        created_by: createdBy,
        status: 'running',
        goal_mode: config.goal_mode,
        num_worlds: config.num_worlds,
        num_cycles: config.num_cycles,
        lead_percent: config.lead_percent,
        mutation_rate: config.mutation_rate,
        weights: config.weights,
      })
      .select('id')
      .single();
    if (runInsertError) throw runInsertError;
    runId = runRow.id;

    const result = runPaCS(profiles, config, compatibilityMap);

    const finalGroupsPayload = result.bestWorld.groups.map((group, index) => ({
      run_id: runId,
      cycle_index: result.cyclesExecuted - 1,
      world_index: 0,
      group_index: index,
      score: group.score.total,
      is_lead_snapshot: false,
      is_final: true,
    }));

    const { data: insertedGroups, error: groupsInsertError } = await supabase
      .from('pacs_groups')
      .insert(finalGroupsPayload)
      .select('id, group_index');
    if (groupsInsertError) throw groupsInsertError;

    const groupIdByIndex = new Map<number, string>(
      (insertedGroups ?? []).map((g: { id: string; group_index: number }) => [
        Number(g.group_index),
        String(g.id),
      ])
    );

    const membershipRows = result.bestWorld.groups.flatMap((group, index) => {
      const groupId = groupIdByIndex.get(index);
      if (!groupId) return [];
      return group.memberIds.map((userId) => ({ group_id: groupId, user_id: userId }));
    });

    if (membershipRows.length > 0) {
      const { error: membersError } = await supabase.from('pacs_group_members').insert(membershipRows);
      if (membersError) throw membersError;
    }

    const { error: runUpdateError } = await supabase
      .from('group_runs')
      .update({
        status: 'completed',
        best_score: result.bestWorldScore,
        average_score: result.averageWorldScore,
        metadata: {
          cycles_executed: result.cyclesExecuted,
          final_group_count: result.bestWorld.groups.length,
        },
      })
      .eq('id', runId);
    if (runUpdateError) throw runUpdateError;

    return json(200, {
      run_id: runId,
      cycles_executed: result.cyclesExecuted,
      best_world_score: result.bestWorldScore,
      average_world_score: result.averageWorldScore,
      groups_created: result.bestWorld.groups.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (runId) {
      await supabase
        .from('group_runs')
        .update({ status: 'failed', error_message: message })
        .eq('id', runId);
    }

    return json(500, { error: message, run_id: runId });
  }
});
