-- Minimal Supabase schema aligned to the current app and requested 4 entities
-- Entities: activity, buddy_system, profiles, reward

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1) PROFILES
-- =====================================================
-- Base requirement: (id, created_at)
-- Additional columns are included to support both profile manipulation pages:
-- - Onboarding page
-- - Profile page
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Basic identity
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,

    -- Onboarding page fields
    nationality TEXT,
    major TEXT,
    year_of_study INTEGER,
    interests TEXT[] NOT NULL DEFAULT '{}',
    personality TEXT,
    gender TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

    -- Profile page fields
    bio TEXT,
    hobbies TEXT[] NOT NULL DEFAULT '{}',
    activity_preferences TEXT[] NOT NULL DEFAULT '{}',
    buddy_preferences TEXT[] NOT NULL DEFAULT '{}',
    preferred_communication TEXT NOT NULL DEFAULT 'chat',
    academic_goals TEXT,
    social_interests TEXT[] NOT NULL DEFAULT '{}'
);

-- =====================================================
-- 2) BUDDY_SYSTEM
-- =====================================================
-- Base requirement: (id, created_at, user_id)
CREATE TABLE IF NOT EXISTS public.buddy_system (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- 3) ACTIVITY
-- =====================================================
-- Base requirement: (id, created_at, g_id, points)
CREATE TABLE IF NOT EXISTS public.activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    g_id UUID REFERENCES public.buddy_system(id) ON DELETE SET NULL,
    points INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 4) REWARD
-- =====================================================
-- Base requirement: (id, created_at, description, activity_id, points, user_id)
CREATE TABLE IF NOT EXISTS public.reward (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    activity_id UUID REFERENCES public.activity(id) ON DELETE SET NULL,
    points INTEGER NOT NULL DEFAULT 0,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_system_user_id ON public.buddy_system(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_g_id ON public.activity(g_id);
CREATE INDEX IF NOT EXISTS idx_reward_user_id ON public.reward(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_activity_id ON public.reward(activity_id);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update only their own row
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- buddy_system: users can manage only their own assignments
DROP POLICY IF EXISTS "Users can view own buddy records" ON public.buddy_system;
CREATE POLICY "Users can view own buddy records" ON public.buddy_system
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own buddy records" ON public.buddy_system;
CREATE POLICY "Users can insert own buddy records" ON public.buddy_system
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- activity: readable by authenticated users, insertable by authenticated users
DROP POLICY IF EXISTS "Authenticated can read activity" ON public.activity;
CREATE POLICY "Authenticated can read activity" ON public.activity
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity;
CREATE POLICY "Authenticated can insert activity" ON public.activity
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- reward: users can read/insert their own rewards
DROP POLICY IF EXISTS "Users can read own rewards" ON public.reward;
CREATE POLICY "Users can read own rewards" ON public.reward
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own rewards" ON public.reward;
CREATE POLICY "Users can insert own rewards" ON public.reward
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Triggers / helper functions
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- AI Conversations Table for Chat History
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID,
    messages JSONB NOT NULL DEFAULT '[]'
);

-- Indexes for AI conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_team_id ON public.ai_conversations(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON public.ai_conversations(updated_at DESC);

-- RLS for AI conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can insert own AI conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can update own AI conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete own AI conversations" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trg_ai_conversations_set_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_ai_conversations_set_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Function to clean up old AI conversations (keep last 50 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_ai_conversations()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.ai_conversations
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id, user_id,
                   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
            FROM public.ai_conversations
        ) ranked
        WHERE rn > 50
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
