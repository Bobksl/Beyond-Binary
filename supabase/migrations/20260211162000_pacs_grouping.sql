-- PaCS (Parallel Cascade Selection) schema additions
-- This migration adds grouping run history, final groups, group members,
-- dynamic configuration, and personality compatibility lookup.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.grouping_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  goal_mode TEXT NOT NULL DEFAULT 'diverse' CHECK (goal_mode IN ('diverse', 'focused')),
  weight_interest NUMERIC NOT NULL DEFAULT 0.35 CHECK (weight_interest >= 0),
  weight_major NUMERIC NOT NULL DEFAULT 0.25 CHECK (weight_major >= 0),
  weight_year NUMERIC NOT NULL DEFAULT 0.20 CHECK (weight_year >= 0),
  weight_personality NUMERIC NOT NULL DEFAULT 0.20 CHECK (weight_personality >= 0),
  num_worlds INTEGER NOT NULL DEFAULT 100 CHECK (num_worlds > 0),
  num_cycles INTEGER NOT NULL DEFAULT 30 CHECK (num_cycles > 0),
  lead_percent NUMERIC NOT NULL DEFAULT 0.05 CHECK (lead_percent > 0 AND lead_percent <= 1),
  mutation_rate NUMERIC NOT NULL DEFAULT 0.20 CHECK (mutation_rate >= 0 AND mutation_rate <= 1),
  plateau_epsilon NUMERIC NOT NULL DEFAULT 0.0005 CHECK (plateau_epsilon >= 0),
  plateau_patience INTEGER NOT NULL DEFAULT 4 CHECK (plateau_patience > 0),
  min_group_size INTEGER NOT NULL DEFAULT 4 CHECK (min_group_size >= 2),
  max_group_size INTEGER NOT NULL DEFAULT 5 CHECK (max_group_size >= min_group_size)
);

INSERT INTO public.grouping_config (is_active)
SELECT TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.grouping_config);

CREATE TABLE IF NOT EXISTS public.group_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  goal_mode TEXT NOT NULL CHECK (goal_mode IN ('diverse', 'focused')),
  num_worlds INTEGER NOT NULL,
  num_cycles INTEGER NOT NULL,
  lead_percent NUMERIC NOT NULL,
  mutation_rate NUMERIC NOT NULL,
  weights JSONB NOT NULL,
  best_score NUMERIC,
  average_score NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS public.pacs_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  run_id UUID NOT NULL REFERENCES public.group_runs(id) ON DELETE CASCADE,
  cycle_index INTEGER NOT NULL DEFAULT 0,
  world_index INTEGER NOT NULL DEFAULT 0,
  group_index INTEGER NOT NULL DEFAULT 0,
  score NUMERIC NOT NULL DEFAULT 0,
  is_lead_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
  is_final BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.pacs_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  group_id UUID NOT NULL REFERENCES public.pacs_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.personality_compatibility (
  p1 TEXT NOT NULL,
  p2 TEXT NOT NULL,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 1),
  PRIMARY KEY (p1, p2)
);

CREATE INDEX IF NOT EXISTS idx_group_runs_created_at ON public.group_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_runs_created_by ON public.group_runs(created_by);
CREATE INDEX IF NOT EXISTS idx_pacs_groups_run_id ON public.pacs_groups(run_id);
CREATE INDEX IF NOT EXISTS idx_pacs_groups_is_final ON public.pacs_groups(is_final);
CREATE INDEX IF NOT EXISTS idx_pacs_group_members_group_id ON public.pacs_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_pacs_group_members_user_id ON public.pacs_group_members(user_id);

ALTER TABLE public.grouping_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacs_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacs_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_compatibility ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read grouping config" ON public.grouping_config;
CREATE POLICY "Authenticated can read grouping config" ON public.grouping_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service can manage grouping config" ON public.grouping_config;
CREATE POLICY "Service can manage grouping config" ON public.grouping_config
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated can read group runs" ON public.group_runs;
CREATE POLICY "Authenticated can read group runs" ON public.group_runs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service can manage group runs" ON public.group_runs;
CREATE POLICY "Service can manage group runs" ON public.group_runs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated can read groups" ON public.pacs_groups;
CREATE POLICY "Authenticated can read groups" ON public.pacs_groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service can manage groups" ON public.pacs_groups;
CREATE POLICY "Service can manage groups" ON public.pacs_groups
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Members can read own and teammates memberships" ON public.pacs_group_members;
CREATE POLICY "Members can read own and teammates memberships" ON public.pacs_group_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.pacs_group_members me
      WHERE me.group_id = pacs_group_members.group_id
        AND me.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service can manage group members" ON public.pacs_group_members;
CREATE POLICY "Service can manage group members" ON public.pacs_group_members
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated can read personality matrix" ON public.personality_compatibility;
CREATE POLICY "Authenticated can read personality matrix" ON public.personality_compatibility
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Service can manage personality matrix" ON public.personality_compatibility;
CREATE POLICY "Service can manage personality matrix" ON public.personality_compatibility
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grouping_config_set_updated_at ON public.grouping_config;
CREATE TRIGGER trg_grouping_config_set_updated_at
BEFORE UPDATE ON public.grouping_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_group_runs_set_updated_at ON public.group_runs;
CREATE TRIGGER trg_group_runs_set_updated_at
BEFORE UPDATE ON public.group_runs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_eligible_profiles()
RETURNS TABLE (
  id UUID,
  major TEXT,
  year_of_study INTEGER,
  interests TEXT[],
  personality TEXT
) AS $$
  SELECT
    p.id,
    p.major,
    p.year_of_study,
    p.interests,
    p.personality
  FROM public.profiles p
  WHERE p.onboarding_completed = TRUE
    AND p.major IS NOT NULL
    AND p.year_of_study IS NOT NULL
    AND p.personality IS NOT NULL
    AND array_length(p.interests, 1) > 0;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_latest_group()
RETURNS TABLE (
  run_id UUID,
  group_id UUID,
  group_score NUMERIC,
  user_id UUID,
  full_name TEXT,
  major TEXT,
  year_of_study INTEGER,
  interests TEXT[],
  personality TEXT
) AS $$
  WITH latest_final_group AS (
    SELECT pgm.group_id
    FROM public.pacs_group_members pgm
    JOIN public.pacs_groups pg ON pg.id = pgm.group_id
    JOIN public.group_runs gr ON gr.id = pg.run_id
    WHERE pgm.user_id = auth.uid()
      AND pg.is_final = TRUE
      AND gr.status = 'completed'
    ORDER BY gr.created_at DESC
    LIMIT 1
  )
  SELECT
    pg.run_id,
    pg.id AS group_id,
    pg.score AS group_score,
    m.user_id,
    p.full_name,
    p.major,
    p.year_of_study,
    p.interests,
    p.personality
  FROM latest_final_group lfg
  JOIN public.pacs_groups pg ON pg.id = lfg.group_id
  JOIN public.pacs_group_members m ON m.group_id = pg.id
  JOIN public.profiles p ON p.id = m.user_id;
$$ LANGUAGE sql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.get_eligible_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_eligible_profiles() TO service_role;

REVOKE ALL ON FUNCTION public.get_my_latest_group() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_latest_group() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_latest_group() TO service_role;
