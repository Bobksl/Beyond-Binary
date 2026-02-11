import { client } from './client.js';

const getCurrentUser = async () => {
  const { data, error } = await client.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Not authenticated');
  return data.user;
};

const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  return user.id;
};

const ensureProfileRow = async (authUser) => {
  if (!authUser?.id) return;

  const { error } = await client
    .from('profiles')
    .upsert(
      {
        id: authUser.id,
        email: authUser.email ?? null,
        full_name: authUser.user_metadata?.full_name ?? authUser.email ?? null,
      },
      { onConflict: 'id' }
    );

  if (error) {
    // Non-fatal here; downstream reads/updates will surface actionable errors.
    console.warn('Could not ensure profile row exists:', error.message);
  }
};

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
    const authUser = await getCurrentUser();
    await ensureProfileRow(authUser);

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  updateProfile: async (updates) => {
    const authUser = await getCurrentUser();

    let { data, error } = await client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authUser.id)
      .select()
      .maybeSingle();

    if (!error && !data) {
      await ensureProfileRow(authUser);
      const retry = await client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', authUser.id)
        .select()
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Could not update profile. Please try again.');
    return data;
  },

  login: async (email, password) => {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },

  signup: async (email, password) => {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },

  completeOnboarding: async (survey) => {
    const authUser = await getCurrentUser();

    const interests = Array.isArray(survey.interests) ? survey.interests : [];
    if (interests.length < 3 || interests.length > 4) {
      throw new Error('Please select 3 to 4 interests.');
    }

    let { data, error } = await client
      .from('profiles')
      .update({
        nationality: survey.nationality,
        major: survey.major,
        year_of_study: survey.year_of_study,
        interests,
        personality: survey.personality,
        gender: survey.gender,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select()
      .maybeSingle();

    if (!error && !data) {
      await ensureProfileRow(authUser);
      const retry = await client
        .from('profiles')
        .update({
          nationality: survey.nationality,
          major: survey.major,
          year_of_study: survey.year_of_study,
          interests,
          personality: survey.personality,
          gender: survey.gender,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)
        .select()
        .maybeSingle();

      data = retry.data;
      error = retry.error;
    }

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Could not complete onboarding. Please try again.');
    return data;
  },

  logout: async () => {
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
  },
};

export const buddySystem = {
  getMine: async () => {
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('buddy_system')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  createMine: async () => {
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('buddy_system')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

export const activity = {
  getByBuddyIds: async (buddyIds = []) => {
    if (!buddyIds.length) return [];
    const { data, error } = await client
      .from('activity')
      .select('*')
      .in('g_id', buddyIds)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },
};

export const reward = {
  getMine: async () => {
    const userId = await getCurrentUserId();
    const { data, error } = await client
      .from('reward')
      .select('*, activity(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },
};

export const grouping = {
  startRun: async (configOverrides = {}) => {
    const authUser = await getCurrentUser();

    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    if (!session?.access_token) {
      throw new Error('Your session is missing or expired. Please log out and log in again.');
    }

    const { data, error } = await client.functions.invoke('pacs-grouping', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        created_by: authUser.id,
        config_overrides: configOverrides,
      },
    });

    if (error) {
      let detailedMessage = error.message || 'Failed to start matching run.';

      // Supabase FunctionsHttpError includes the raw Response in error.context.
      // Try to surface backend JSON error (e.g., "Not enough eligible profiles...").
      if (error?.context && typeof error.context.text === 'function') {
        try {
          const statusCode = typeof error.context.status === 'number' ? error.context.status : null;
          const rawBody = await error.context.text();

          if (rawBody) {
            try {
              const payload = JSON.parse(rawBody);
              if (payload?.error && typeof payload.error === 'string') {
                detailedMessage = payload.error;
              } else {
                detailedMessage = rawBody;
              }
            } catch {
              detailedMessage = rawBody;
            }
          }

          if (statusCode) {
            detailedMessage = `[${statusCode}] ${detailedMessage}`;
          }
        } catch {
          // Keep fallback message
        }
      }

      throw new Error(detailedMessage);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  },

  getLatestRun: async () => {
    const { data, error } = await client
      .from('group_runs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  getMyLatestGroup: async () => {
    const { data, error } = await client.rpc('get_my_latest_group');
    if (error) throw new Error(error.message);
    return data || [];
  },
};
