import {client} from './client.js';

export const user = {
    me: async () => {
        const { data, error } = await client.auth.getUser();
        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }
        return data.user;
    },

    profile: async () => {
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', (await client.auth.getUser()).data.user?.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    updateProfile: async (updates) => {
        const { data, error } = await client
            .from('profiles')
            .update(updates)
            .eq('id', (await client.auth.getUser()).data.user?.id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    login: async (email, password) => {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
            throw new Error(error.message);
        }
        return data.user;
    },

    signup: async (email, password) => {
        const { data, error } = await client.auth.signUp({ email, password });
        if (error) {
            throw new Error(error.message);
        }
        return data.user;
    },

    logout: async () => {
        const { error } = await client.auth.signOut();
        if (error) {
            throw new Error(error.message);
        }
    }
};

export const teams = {
    myTeam: async () => {
        const { data, error } = await client
            .from('team_members')
            .select(`
                team_id,
                teams (
                    id,
                    name,
                    description,
                    created_at,
                    team_members (
                        user_id,
                        profiles (
                            id,
                            email,
                            full_name,
                            avatar_url
                        )
                    )
                )
            `)
            .eq('user_id', (await client.auth.getUser()).data.user?.id)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching team:', error);
            return null;
        }
        return data?.teams;
    },

    getProgress: async (teamId) => {
        const { data, error } = await client
            .from('progress_tracks')
            .select('*')
            .eq('team_id', teamId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching progress:', error);
            return null;
        }
        return data;
    }
};

export const interactions = {
    getTeamInteractions: async (teamId) => {
        const { data, error } = await client
            .from('interactions')
            .select(`
                *,
                contributions (
                    id,
                    user_id,
                    contribution_type,
                    content,
                    created_at,
                    profiles (
                        id,
                        email,
                        full_name,
                        avatar_url
                    )
                ),
                validations (
                    id,
                    validator_id,
                    contribution_id,
                    validation_type,
                    score,
                    feedback,
                    created_at,
                    profiles!validations_validator_id_fkey (
                        id,
                        email,
                        full_name
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching interactions:', error);
            return [];
        }
        return data;
    },

    createPeerExplanation: async (teamId, title, content) => {
        // Create interaction
        const { data: interaction, error: interactionError } = await client
            .from('interactions')
            .insert({
                team_id: teamId,
                interaction_type: 'peer_explanation',
                title,
                description: content,
                status: 'active'
            })
            .select()
            .single();

        if (interactionError) {
            throw new Error(interactionError.message);
        }

        // Add contribution
        const { data: contribution, error: contributionError } = await client
            .from('contributions')
            .insert({
                interaction_id: interaction.id,
                user_id: (await client.auth.getUser()).data.user?.id,
                contribution_type: 'post',
                content
            })
            .select()
            .single();

        if (contributionError) {
            throw new Error(contributionError.message);
        }

        return { interaction, contribution };
    },

    createCollaborativeEdit: async (teamId, title, initialContent) => {
        const { data: interaction, error: interactionError } = await client
            .from('interactions')
            .insert({
                team_id: teamId,
                interaction_type: 'collaborative_editing',
                title,
                description: initialContent,
                status: 'active'
            })
            .select()
            .single();

        if (interactionError) {
            throw new Error(interactionError.message);
        }

        return interaction;
    },

    createStudySession: async (teamId, title, description, scheduledTime) => {
        const { data: interaction, error: interactionError } = await client
            .from('interactions')
            .insert({
                team_id: teamId,
                interaction_type: 'study_session',
                title,
                description,
                status: 'active',
                metadata: { scheduled_time: scheduledTime }
            })
            .select()
            .single();

        if (interactionError) {
            throw new Error(interactionError.message);
        }

        return interaction;
    },

    addContribution: async (interactionId, contributionType, content) => {
        const { data, error } = await client
            .from('contributions')
            .insert({
                interaction_id: interactionId,
                user_id: (await client.auth.getUser()).data.user?.id,
                contribution_type: contributionType,
                content
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    },

    addValidation: async (interactionId, contributionId, validationType, feedback = '') => {
        const { data, error } = await client
            .from('validations')
            .insert({
                interaction_id: interactionId,
                validator_id: (await client.auth.getUser()).data.user?.id,
                contribution_id: contributionId,
                validation_type: validationType,
                feedback,
                score: 1
            })
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }
        return data;
    }
};

export const missions = {
    getCurrentMission: async (teamId) => {
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
        currentWeekStart.setHours(0, 0, 0, 0);

        const { data, error } = await client
            .from('missions')
            .select(`
                *,
                mission_progress (
                    id,
                    interaction_type,
                    user_id,
                    points,
                    profiles (
                        id,
                        email,
                        full_name
                    )
                )
            `)
            .eq('team_id', teamId)
            .eq('week_start', currentWeekStart.toISOString().split('T')[0])
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching mission:', error);
            return null;
        }
        return data;
    },

    checkCompletion: async (missionId) => {
        // Get mission progress
        const { data: progress, error: progressError } = await client
            .from('mission_progress')
            .select('interaction_type, user_id')
            .eq('mission_id', missionId);

        if (progressError) {
            throw new Error(progressError.message);
        }

        // Check completion criteria
        const uniqueInteractionTypes = [...new Set(progress.map(p => p.interaction_type))];
        const uniqueUsers = [...new Set(progress.map(p => p.user_id))];

        const mission = await client
            .from('missions')
            .select('*')
            .eq('id', missionId)
            .single();

        if (!mission.data) {
            return false;
        }

        const isCompleted = uniqueInteractionTypes.length >= mission.data.required_interactions &&
                           uniqueUsers.length >= mission.data.required_members;

        if (isCompleted && mission.data.status === 'active') {
            // Mark mission as completed and update progress
            await client
                .from('missions')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', missionId);

            // Update team progress
            await client.rpc('increment_team_progress', { mission_team_id: mission.data.team_id });
        }

        return isCompleted;
    }
};

export const unlocks = {
    getAvailable: async () => {
        const { data, error } = await client
            .from('unlocks')
            .select('*')
            .eq('is_active', true)
            .order('required_level');

        if (error) {
            console.error('Error fetching unlocks:', error);
            return [];
        }
        return data;
    },

    getTeamUnlocks: async (teamId) => {
        const progress = await teams.getProgress(teamId);
        if (!progress) return [];

        const available = await unlocks.getAvailable();
        return available.filter(unlock => unlock.required_level <= progress.current_level);
    }
};

export const news = {
    getAll: async (limit = 50) => {
        const { data, error } = await client
            .from('news')
            .select(`
                *,
                profiles (
                    id,
                    email,
                    full_name
                )
            `)
            .lte('published_at', new Date().toISOString())
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching news:', error);
            return [];
        }
        return data;
    },

    getFeatured: async () => {
        const { data, error } = await client
            .from('news')
            .select(`
                *,
                profiles (
                    id,
                    email,
                    full_name
                )
            `)
            .eq('is_featured', true)
            .lte('published_at', new Date().toISOString())
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('published_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('Error fetching featured news:', error);
            return [];
        }
        return data;
    },

    getMyBookmarks: async () => {
        const { data, error } = await client
            .from('bookmarks')
            .select(`
                id,
                created_at,
                news (
                    id,
                    title,
                    content,
                    published_at,
                    is_featured,
                    profiles (
                        id,
                        email,
                        full_name
                    )
                )
            `)
            .eq('user_id', (await client.auth.getUser()).data.user?.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching bookmarks:', error);
            return [];
        }
        return data.map(item => ({ ...item.news, bookmark_id: item.id, bookmarked_at: item.created_at }));
    },

    toggleBookmark: async (newsId) => {
        const userId = (await client.auth.getUser()).data.user?.id;
        if (!userId) throw new Error('Not authenticated');

        // Check if bookmark exists
        const { data: existing, error: checkError } = await client
            .from('bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('news_id', newsId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(checkError.message);
        }

        if (existing) {
            // Remove bookmark
            const { error } = await client
                .from('bookmarks')
                .delete()
                .eq('id', existing.id);

            if (error) {
                throw new Error(error.message);
            }
            return false; // Not bookmarked
        } else {
            // Add bookmark
            const { error } = await client
                .from('bookmarks')
                .insert({
                    user_id: userId,
                    news_id: newsId
                });

            if (error) {
                throw new Error(error.message);
            }
            return true; // Bookmarked
        }
    }
};
