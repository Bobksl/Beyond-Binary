-- Supabase Database Schema for Reward System
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    study_style TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{}',
    accessibility_needs TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Team members junction table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(team_id, user_id)
);

-- Interactions base table
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('peer_explanation', 'collaborative_editing', 'study_session')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Contributions to interactions
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    contribution_type TEXT NOT NULL, -- 'post', 'edit', 'validate', 'attend'
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(interaction_id, user_id, contribution_type)
);

-- Validations (helpful marks, validations, etc.)
CREATE TABLE IF NOT EXISTS public.validations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
    validator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    contribution_id UUID REFERENCES public.contributions(id) ON DELETE CASCADE,
    validation_type TEXT NOT NULL CHECK (validation_type IN ('helpful', 'validation', 'attendance')),
    score INTEGER DEFAULT 1,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(interaction_id, validator_id, contribution_id, validation_type)
);

-- Weekly missions
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    required_interactions INTEGER DEFAULT 2,
    required_members INTEGER DEFAULT 3,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, week_start)
);

-- Mission progress tracking
CREATE TABLE IF NOT EXISTS public.mission_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES public.interactions(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mission_id, interaction_type, user_id)
);

-- Progress tracks (team progression)
CREATE TABLE IF NOT EXISTS public.progress_tracks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    unlocked_features TEXT[] DEFAULT '{}',
    theme_customization JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id)
);

-- Available unlocks/rewards
CREATE TABLE IF NOT EXISTS public.unlocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('tool', 'theme', 'feature')),
    required_level INTEGER NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News/Announcements
CREATE TABLE IF NOT EXISTS public.news (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks for news
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    news_id UUID REFERENCES public.news(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, news_id)
);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (users can see their own data and team data)
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view teams they're members of" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = teams.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their team memberships" ON public.team_members
    FOR SELECT USING (user_id = auth.uid());

-- Interactions policies
CREATE POLICY "Users can view interactions in their teams" ON public.interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = interactions.team_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create interactions in their teams" ON public.interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = interactions.team_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update interactions in their teams" ON public.interactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = interactions.team_id AND user_id = auth.uid()
        )
    );

-- Contributions policies
CREATE POLICY "Users can view contributions in their teams" ON public.contributions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interactions i
            JOIN public.team_members tm ON i.team_id = tm.team_id
            WHERE i.id = contributions.interaction_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create contributions in their teams" ON public.contributions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interactions i
            JOIN public.team_members tm ON i.team_id = tm.team_id
            WHERE i.id = contributions.interaction_id AND tm.user_id = auth.uid()
        )
    );

-- Validations policies
CREATE POLICY "Users can view validations in their teams" ON public.validations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.interactions i
            JOIN public.team_members tm ON i.team_id = tm.team_id
            WHERE i.id = validations.interaction_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create validations in their teams" ON public.validations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.interactions i
            JOIN public.team_members tm ON i.team_id = tm.team_id
            WHERE i.id = validations.interaction_id AND tm.user_id = auth.uid()
        )
    );

-- Missions policies
CREATE POLICY "Users can view missions for their teams" ON public.missions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = missions.team_id AND user_id = auth.uid()
        )
    );

-- Mission progress policies
CREATE POLICY "Users can view mission progress for their teams" ON public.mission_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.missions m
            JOIN public.team_members tm ON m.team_id = tm.team_id
            WHERE m.id = mission_progress.mission_id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create mission progress in their teams" ON public.mission_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.missions m
            JOIN public.team_members tm ON m.team_id = tm.team_id
            WHERE m.id = mission_progress.mission_id AND tm.user_id = auth.uid()
        )
    );

-- Progress tracks policies
CREATE POLICY "Users can view progress tracks for their teams" ON public.progress_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = progress_tracks.team_id AND user_id = auth.uid()
        )
    );

-- Unlocks policies (public read)
CREATE POLICY "Anyone can view unlocks" ON public.unlocks
    FOR SELECT USING (true);

-- News policies (public read)
CREATE POLICY "Anyone can view news" ON public.news
    FOR SELECT USING (true);

-- Bookmarks policies
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookmarks" ON public.bookmarks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
    FOR DELETE USING (user_id = auth.uid());

-- Functions for automatic team assignment
CREATE OR REPLACE FUNCTION public.assign_user_to_team()
RETURNS TRIGGER AS $$
BEGIN
    -- Find a team with less than 6 members
    INSERT INTO public.team_members (team_id, user_id)
    SELECT t.id, NEW.id
    FROM public.teams t
    LEFT JOIN (
        SELECT team_id, COUNT(*) as member_count
        FROM public.team_members
        WHERE is_active = true
        GROUP BY team_id
    ) tm ON t.id = tm.team_id
    WHERE t.is_active = true
    AND (tm.member_count IS NULL OR tm.member_count < 6)
    ORDER BY t.created_at
    LIMIT 1;

    -- If no team found, create a new one
    IF NOT FOUND THEN
        WITH new_team AS (
            INSERT INTO public.teams (name)
            VALUES ('Team ' || (SELECT COUNT(*) + 1 FROM public.teams))
            RETURNING id
        )
        INSERT INTO public.team_members (team_id, user_id)
        SELECT id, NEW.id FROM new_team;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to assign new users to teams
CREATE TRIGGER on_profile_created_assign_team
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.assign_user_to_team();

-- Function to create weekly missions
CREATE OR REPLACE FUNCTION public.create_weekly_missions()
RETURNS VOID AS $$
DECLARE
    current_week_start DATE;
    current_week_end DATE;
BEGIN
    current_week_start := DATE_TRUNC('week', NOW())::DATE;
    current_week_end := current_week_start + INTERVAL '6 days';

    INSERT INTO public.missions (team_id, week_start, week_end)
    SELECT t.id, current_week_start, current_week_end
    FROM public.teams t
    LEFT JOIN public.missions m ON m.team_id = t.id AND m.week_start = current_week_start
    WHERE m.id IS NULL AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment team progress when mission is completed
CREATE OR REPLACE FUNCTION public.increment_team_progress(mission_team_id UUID)
RETURNS VOID AS $$
DECLARE
    progress_record RECORD;
BEGIN
    -- Get or create progress track
    SELECT * INTO progress_record
    FROM public.progress_tracks
    WHERE team_id = mission_team_id;

    IF NOT FOUND THEN
        INSERT INTO public.progress_tracks (team_id, current_level, total_points, unlocked_features)
        VALUES (mission_team_id, 1, 1, '{}');
    ELSE
        UPDATE public.progress_tracks
        SET
            total_points = total_points + 1,
            current_level = GREATEST(current_level, LEAST(6, FLOOR((total_points + 1) / 2.0) + 1)),
            updated_at = NOW()
        WHERE team_id = mission_team_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default unlocks
INSERT INTO public.unlocks (name, description, type, required_level, metadata) VALUES
('Shared Whiteboard', 'Collaborative concept-mapping tool for your team', 'tool', 1, '{"icon": "whiteboard"}'),
('Peer Tutoring Room', 'Structured tutoring space with role prompts', 'tool', 2, '{"icon": "users"}'),
('Exam Prep Templates', 'Collaborative exam preparation templates', 'tool', 3, '{"icon": "file-text"}'),
('Wellbeing Activities', 'Optional team wellbeing micro-activities', 'feature', 4, '{"icon": "heart"}'),
('Custom Theme', 'Unlock team space theme customization', 'theme', 5, '{"icon": "palette"}'),
('Workspace Customization', 'Shared workspace customization options', 'theme', 6, '{"icon": "settings"}')
ON CONFLICT DO NOTHING;

-- Insert sample news
INSERT INTO public.news (title, content, is_featured, published_at) VALUES
('Welcome to Beyond Binary!', 'We''re excited to launch our new collaborative learning platform! This game-like app rewards teams for cooperative academic interactions. Start exploring your team dashboard and unlock new features as you work together.', true, NOW()),
('Team Formation Complete', 'All students have been automatically assigned to learning teams of 4-6 members. Check your team dashboard to see who you''re working with and start collaborating on this week''s mission!', false, NOW() - INTERVAL '2 days'),
('First Weekly Mission Begins', 'This week''s challenge: Complete at least 2 different types of cooperative interactions with at least 3 team members. Try peer explanations, collaborative problem-solving, or study sessions!', false, NOW() - INTERVAL '1 day'),
('New Features Coming Soon', 'As your team completes missions and levels up, you''ll unlock powerful collaborative tools including shared whiteboards, peer tutoring rooms, and exam preparation templates. Keep up the great work!', false, NOW() - INTERVAL '3 hours'),
('Study Tips & Resources', 'Remember to mark explanations as "helpful" when you learn something new, and don''t forget to validate your teammates'' contributions. Every interaction helps your team progress!', false, NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Onboarding survey extensions + cooperative enforcement
-- =====================================================

-- Interactive onboarding fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_of_study INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Extended user profile fields for UniMates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_preferences TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS buddy_preferences TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_communication TEXT DEFAULT 'chat';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_goals TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_interests TEXT[] DEFAULT '{}';

-- Team-level rotating capability unlock history
CREATE TABLE IF NOT EXISTS public.team_capability_unlocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    capability_key TEXT NOT NULL CHECK (capability_key IN (
        'shared_whiteboard',
        'peer_tutoring_room',
        'exam_prep_templates',
        'wellbeing_micro_activities'
    )),
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, mission_id)
);

ALTER TABLE public.team_capability_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team capability unlocks for their teams" ON public.team_capability_unlocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = team_capability_unlocks.team_id AND user_id = auth.uid()
        )
    );

-- Compatibility score between two users for buddy grouping
CREATE OR REPLACE FUNCTION public.profile_compatibility_score(user_a UUID, user_b UUID)
RETURNS NUMERIC AS $$
DECLARE
    a public.profiles%ROWTYPE;
    b public.profiles%ROWTYPE;
    shared_interest_count INTEGER := 0;
    score NUMERIC := 0;
BEGIN
    SELECT * INTO a FROM public.profiles WHERE id = user_a;
    SELECT * INTO b FROM public.profiles WHERE id = user_b;

    IF a.id IS NULL OR b.id IS NULL THEN
        RETURN 0;
    END IF;

    IF a.major IS NOT NULL AND b.major IS NOT NULL AND a.major = b.major THEN
        score := score + 2;
    END IF;

    IF a.year_of_study IS NOT NULL AND b.year_of_study IS NOT NULL THEN
        IF ABS(a.year_of_study - b.year_of_study) <= 1 THEN
            score := score + 1.5;
        END IF;
    END IF;

    IF a.nationality IS NOT NULL AND b.nationality IS NOT NULL THEN
        IF a.nationality = b.nationality THEN
            score := score + 0.5;
        ELSE
            score := score + 0.75;
        END IF;
    END IF;

    IF a.personality IS NOT NULL AND b.personality IS NOT NULL THEN
        IF a.personality = b.personality THEN
            score := score + 1;
        ELSE
            score := score + 0.75;
        END IF;
    END IF;

    IF a.interests IS NOT NULL AND b.interests IS NOT NULL THEN
        SELECT COUNT(*) INTO shared_interest_count
        FROM UNNEST(a.interests) ai
        INNER JOIN UNNEST(b.interests) bi ON ai = bi;

        score := score + LEAST(3, shared_interest_count);
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reassign user to most compatible team after onboarding completion.
-- Uses capacity and compatibility constraints (stable-preference style for one-sided assignment).
CREATE OR REPLACE FUNCTION public.reassign_user_to_optimal_team(target_user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
    current_team_id UUID;
    current_team_size INTEGER := 0;
    best_team_id UUID;
    best_score NUMERIC := -1;
    current_team_score NUMERIC := 0;
BEGIN
    IF target_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT tm.team_id
    INTO current_team_id
    FROM public.team_members tm
    WHERE tm.user_id = target_user_id AND tm.is_active = true
    LIMIT 1;

    IF current_team_id IS NOT NULL THEN
        SELECT COUNT(*) INTO current_team_size
        FROM public.team_members
        WHERE team_id = current_team_id AND is_active = true;

        SELECT COALESCE(AVG(public.profile_compatibility_score(target_user_id, tm.user_id)), 0)
        INTO current_team_score
        FROM public.team_members tm
        WHERE tm.team_id = current_team_id
          AND tm.is_active = true
          AND tm.user_id <> target_user_id;
    END IF;

    SELECT candidate.team_id, candidate.avg_score
    INTO best_team_id, best_score
    FROM (
        SELECT
            t.id AS team_id,
            COALESCE(AVG(public.profile_compatibility_score(target_user_id, tm.user_id)), 0)
                + CASE
                    WHEN COUNT(tm.user_id) < 4 THEN 1.5
                    WHEN COUNT(tm.user_id) BETWEEN 4 AND 5 THEN 1
                    ELSE 0
                  END AS avg_score
        FROM public.teams t
        LEFT JOIN public.team_members tm
            ON tm.team_id = t.id AND tm.is_active = true AND tm.user_id <> target_user_id
        WHERE t.is_active = true
          AND (
              SELECT COUNT(*)
              FROM public.team_members tm2
              WHERE tm2.team_id = t.id AND tm2.is_active = true
          ) < 6
        GROUP BY t.id
    ) candidate
    ORDER BY candidate.avg_score DESC
    LIMIT 1;

    IF best_team_id IS NULL THEN
        RETURN current_team_id;
    END IF;

    IF current_team_id IS NULL THEN
        INSERT INTO public.team_members (team_id, user_id, is_active)
        VALUES (best_team_id, target_user_id, true)
        ON CONFLICT (team_id, user_id)
        DO UPDATE SET is_active = true;

        RETURN best_team_id;
    END IF;

    IF best_team_id = current_team_id THEN
        RETURN current_team_id;
    END IF;

    -- Move only when meaningfully better, and don't underfill source team
    IF best_score >= current_team_score + 0.5 AND current_team_size > 4 THEN
        UPDATE public.team_members
        SET is_active = false
        WHERE team_id = current_team_id
          AND user_id = target_user_id;

        INSERT INTO public.team_members (team_id, user_id, is_active)
        VALUES (best_team_id, target_user_id, true)
        ON CONFLICT (team_id, user_id)
        DO UPDATE SET is_active = true;

        RETURN best_team_id;
    END IF;

    RETURN current_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rotating team capability unlock after each completed mission
CREATE OR REPLACE FUNCTION public.grant_rotating_capability(team_id_input UUID, mission_id_input UUID)
RETURNS TEXT AS $$
DECLARE
    unlock_count INTEGER;
    capability TEXT;
BEGIN
    SELECT COUNT(*) INTO unlock_count
    FROM public.team_capability_unlocks
    WHERE team_id = team_id_input;

    capability := (ARRAY[
        'shared_whiteboard',
        'peer_tutoring_room',
        'exam_prep_templates',
        'wellbeing_micro_activities'
    ])[((unlock_count % 4) + 1)];

    INSERT INTO public.team_capability_unlocks (team_id, mission_id, capability_key)
    VALUES (team_id_input, mission_id_input, capability)
    ON CONFLICT (team_id, mission_id) DO NOTHING;

    RETURN capability;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Strict mission completion check (>=2 interaction rules + >=3 unique contributors)
CREATE OR REPLACE FUNCTION public.evaluate_mission_completion(mission_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
    mission_record public.missions%ROWTYPE;
    unique_types INTEGER := 0;
    unique_members INTEGER := 0;
BEGIN
    SELECT * INTO mission_record
    FROM public.missions
    WHERE id = mission_id_input;

    IF mission_record.id IS NULL THEN
        RETURN false;
    END IF;

    SELECT COUNT(DISTINCT interaction_type), COUNT(DISTINCT user_id)
    INTO unique_types, unique_members
    FROM public.mission_progress
    WHERE mission_id = mission_record.id;

    IF unique_types >= mission_record.required_interactions
       AND unique_members >= mission_record.required_members
       AND mission_record.status = 'active' THEN

        UPDATE public.missions
        SET status = 'completed', completed_at = NOW()
        WHERE id = mission_record.id;

        PERFORM public.increment_team_progress(mission_record.team_id);
        PERFORM public.grant_rotating_capability(mission_record.team_id, mission_record.id);
        RETURN true;
    END IF;

    RETURN mission_record.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rule verification + anti-gaming insertion for mission_progress
CREATE OR REPLACE FUNCTION public.verify_interaction_and_record_progress(interaction_id_input UUID)
RETURNS JSONB AS $$
DECLARE
    interaction_record public.interactions%ROWTYPE;
    mission_record public.missions%ROWTYPE;
    post_contribution RECORD;
    helpful_validation RECORD;
    validator_concept_check RECORD;
    editor_ids UUID[];
    final_validator_id UUID;
    attendee_ids UUID[];
    reflected_ids UUID[];
    active_user_ids UUID[] := ARRAY[]::UUID[];
    active_user_id UUID;
    mission_completed BOOLEAN := false;
BEGIN
    SELECT * INTO interaction_record
    FROM public.interactions
    WHERE id = interaction_id_input;

    IF interaction_record.id IS NULL THEN
        RETURN jsonb_build_object('verified', false, 'reason', 'interaction_not_found');
    END IF;

    -- Ensure current week mission exists
    INSERT INTO public.missions (team_id, week_start, week_end)
    VALUES (
        interaction_record.team_id,
        DATE_TRUNC('week', interaction_record.created_at)::DATE,
        DATE_TRUNC('week', interaction_record.created_at)::DATE + INTERVAL '6 days'
    )
    ON CONFLICT (team_id, week_start) DO NOTHING;

    SELECT * INTO mission_record
    FROM public.missions
    WHERE team_id = interaction_record.team_id
      AND week_start = DATE_TRUNC('week', interaction_record.created_at)::DATE
    LIMIT 1;

    IF mission_record.id IS NULL THEN
        RETURN jsonb_build_object('verified', false, 'reason', 'mission_not_found');
    END IF;

    IF interaction_record.interaction_type = 'peer_explanation' THEN
        -- Rule 1: poster + helpful marker + concept check
        SELECT * INTO post_contribution
        FROM public.contributions
        WHERE interaction_id = interaction_record.id
          AND contribution_type = 'post'
        ORDER BY created_at ASC
        LIMIT 1;

        IF post_contribution.id IS NULL THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'missing_peer_explanation_post');
        END IF;

        SELECT * INTO helpful_validation
        FROM public.validations
        WHERE interaction_id = interaction_record.id
          AND contribution_id = post_contribution.id
          AND validation_type = 'helpful'
          AND validator_id <> post_contribution.user_id
        ORDER BY created_at ASC
        LIMIT 1;

        IF helpful_validation.id IS NULL THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'missing_helpful_validation');
        END IF;

        SELECT * INTO validator_concept_check
        FROM public.contributions
        WHERE interaction_id = interaction_record.id
          AND user_id = helpful_validation.validator_id
          AND contribution_type = 'concept_check'
          AND COALESCE(content, '') <> ''
        ORDER BY created_at ASC
        LIMIT 1;

        IF validator_concept_check.id IS NULL THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'missing_concept_check');
        END IF;

        active_user_ids := ARRAY[post_contribution.user_id, helpful_validation.validator_id];

    ELSIF interaction_record.interaction_type = 'collaborative_editing' THEN
        -- Rule 2: >=2 editors + third validator
        SELECT ARRAY_AGG(DISTINCT user_id) INTO editor_ids
        FROM public.contributions
        WHERE interaction_id = interaction_record.id
          AND contribution_type = 'edit';

        IF COALESCE(array_length(editor_ids, 1), 0) < 2 THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'insufficient_editors');
        END IF;

        SELECT v.validator_id INTO final_validator_id
        FROM public.validations v
        WHERE v.interaction_id = interaction_record.id
          AND v.validation_type = 'validation'
          AND NOT (v.validator_id = ANY(editor_ids))
        ORDER BY v.created_at ASC
        LIMIT 1;

        IF final_validator_id IS NULL THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'missing_third_member_validator');
        END IF;

        active_user_ids := editor_ids || final_validator_id;

    ELSIF interaction_record.interaction_type = 'study_session' THEN
        -- Rule 3: >=3 attendees and each has reflection
        SELECT ARRAY_AGG(DISTINCT user_id) INTO attendee_ids
        FROM public.contributions
        WHERE interaction_id = interaction_record.id
          AND contribution_type = 'attend';

        SELECT ARRAY_AGG(DISTINCT user_id) INTO reflected_ids
        FROM public.contributions
        WHERE interaction_id = interaction_record.id
          AND contribution_type = 'reflection'
          AND COALESCE(content, '') <> '';

        SELECT ARRAY_AGG(attendee)
        INTO active_user_ids
        FROM UNNEST(COALESCE(attendee_ids, ARRAY[]::UUID[])) attendee
        WHERE attendee = ANY(COALESCE(reflected_ids, ARRAY[]::UUID[]));

        IF COALESCE(array_length(active_user_ids, 1), 0) < 3 THEN
            RETURN jsonb_build_object('verified', false, 'reason', 'insufficient_attendance_or_reflections');
        END IF;
    ELSE
        RETURN jsonb_build_object('verified', false, 'reason', 'unsupported_interaction_type');
    END IF;

    UPDATE public.interactions
    SET status = 'completed', completed_at = COALESCE(completed_at, NOW())
    WHERE id = interaction_record.id;

    -- Anti-gaming enforced by UNIQUE(mission_id, interaction_type, user_id)
    FOREACH active_user_id IN ARRAY active_user_ids LOOP
        INSERT INTO public.mission_progress (
            mission_id,
            interaction_type,
            user_id,
            interaction_id,
            points
        )
        VALUES (
            mission_record.id,
            interaction_record.interaction_type,
            active_user_id,
            interaction_record.id,
            1
        )
        ON CONFLICT (mission_id, interaction_type, user_id) DO NOTHING;
    END LOOP;

    mission_completed := public.evaluate_mission_completion(mission_record.id);

    RETURN jsonb_build_object(
        'verified', true,
        'interaction_id', interaction_record.id,
        'interaction_type', interaction_record.interaction_type,
        'active_contributors', COALESCE(array_length(active_user_ids, 1), 0),
        'mission_id', mission_record.id,
        'mission_completed', mission_completed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
