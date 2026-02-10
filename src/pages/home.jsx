import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { user, teams, missions, interactions, unlocks } from '@/api/entities';

const Home = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [team, setTeam] = useState(null);
    const [currentMission, setCurrentMission] = useState(null);
    const [teamInteractions, setTeamInteractions] = useState([]);
    const [teamProgress, setTeamProgress] = useState(null);
    const [availableUnlocks, setAvailableUnlocks] = useState([]);
    const [capabilityUnlocks, setCapabilityUnlocks] = useState([]);
    const [actionError, setActionError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [creating, setCreating] = useState(false);
    const [newInteraction, setNewInteraction] = useState({
        type: 'peer_explanation',
        title: '',
        description: '',
        when: ''
    });
    const [quickInputs, setQuickInputs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeamData = async () => {
            try {
                const me = await user.me();
                setCurrentUser(me);

                if (!me) {
                    setLoading(false);
                    return;
                }

                const profileData = await user.profile();
                setProfile(profileData);

                if (!profileData?.onboarding_completed) {
                    setLoading(false);
                    return;
                }

                const teamData = await teams.myTeam();
                const [missionData, interactionsData, progressData, unlocksData, capabilityData] = await Promise.all([
                    teamData ? missions.getCurrentMission(teamData.id) : null,
                    teamData ? interactions.getTeamInteractions(teamData.id) : [],
                    teamData ? teams.getProgress(teamData.id) : null,
                    unlocks.getAvailable(),
                    teamData ? teams.getCapabilityUnlocks(teamData.id) : []
                ]);

                setTeam(teamData);
                setCurrentMission(missionData);
                setTeamInteractions(interactionsData);
                setTeamProgress(progressData);
                setAvailableUnlocks(unlocksData);
                setCapabilityUnlocks(capabilityData);
            } catch (error) {
                console.error('Error loading team data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTeamData();
    }, []);

    const refreshTeamData = async () => {
        if (!team) return;
        const [missionData, interactionsData, progressData, capabilityData] = await Promise.all([
            missions.getCurrentMission(team.id),
            interactions.getTeamInteractions(team.id),
            teams.getProgress(team.id),
            teams.getCapabilityUnlocks(team.id)
        ]);
        setCurrentMission(missionData);
        setTeamInteractions(interactionsData);
        setTeamProgress(progressData);
        setCapabilityUnlocks(capabilityData);
    };

    const handleCreateInteraction = async (e) => {
        e.preventDefault();
        if (!team) return;
        setActionError('');
        setActionMessage('');

        if (!newInteraction.title || !newInteraction.description) {
            setActionError('Please include title and description.');
            return;
        }

        try {
            setCreating(true);
            if (newInteraction.type === 'peer_explanation') {
                await interactions.createPeerExplanation(team.id, newInteraction.title, newInteraction.description);
            } else if (newInteraction.type === 'collaborative_editing') {
                await interactions.createCollaborativeEdit(team.id, newInteraction.title, newInteraction.description);
            } else {
                await interactions.createStudySession(
                    team.id,
                    newInteraction.title,
                    newInteraction.description,
                    newInteraction.when || new Date().toISOString()
                );
            }

            setActionMessage('Interaction created successfully. Ask teammates to complete role-based steps.');
            setNewInteraction({ type: 'peer_explanation', title: '', description: '', when: '' });
            await refreshTeamData();
        } catch (error) {
            setActionError(error.message || 'Failed to create interaction.');
        } finally {
            setCreating(false);
        }
    };

    const setQuickInput = (interactionId, key, value) => {
        setQuickInputs((prev) => ({
            ...prev,
            [interactionId]: {
                ...(prev[interactionId] || {}),
                [key]: value
            }
        }));
    };

    const addContribution = async (interactionId, type, content = '') => {
        setActionError('');
        setActionMessage('');
        try {
            await interactions.addContribution(interactionId, type, content);
            setActionMessage('Contribution submitted.');
            await refreshTeamData();
        } catch (error) {
            setActionError(error.message || 'Could not submit contribution.');
        }
    };

    const addValidation = async (interactionId, contributionId, validationType, feedback = '') => {
        setActionError('');
        setActionMessage('');
        try {
            await interactions.addValidation(interactionId, contributionId, validationType, feedback);
            setActionMessage('Validation submitted.');
            await refreshTeamData();
        } catch (error) {
            setActionError(error.message || 'Could not submit validation.');
        }
    };

    const verifyInteractionProgress = async (interactionId) => {
        setActionError('');
        setActionMessage('');
        try {
            const result = await interactions.verifyInteraction(interactionId);
            if (!result?.verified) {
                setActionError(`Verification failed: ${result?.reason || 'missing requirements'}`);
                return;
            }

            setActionMessage(
                result.mission_completed
                    ? 'Verified and mission completed! Team progression and capability unlock awarded.'
                    : 'Verified. Mission progress updated for your team.'
            );
            await refreshTeamData();
        } catch (error) {
            setActionError(error.message || 'Verification failed.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="text-center py-12">
                <h1 className="text-3xl font-bold mb-4">Welcome to UniMates</h1>
                <p className="text-lg text-gray-700 mb-6">Please sign in to join your team mission.</p>
                <Link to="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">Go to Login</Link>
            </div>
        );
    }

    if (profile && !profile.onboarding_completed) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 shadow">
                <h2 className="text-2xl font-bold mb-2">Complete onboarding first</h2>
                <p className="text-gray-700 mb-5">
                    Fill your buddy profile (nationality, major, year, interests, personality, gender) so we can place you into your optimal learning team.
                </p>
                <Link to="/onboarding" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Start onboarding survey
                </Link>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-12">
                <h1 className="text-3xl font-bold mb-4">Welcome to UniMates</h1>
                <p className="text-lg text-gray-700 mb-6">
                    You're being assigned to a learning team. Please check back soon!
                </p>
                <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded"></div>
            </div>
        );
    }

    const teamMembers = team.team_members || [];
    const activeInteractions = teamInteractions.filter(i => i.status === 'active');

    return (
        <div className="space-y-8">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                <h1 className="text-3xl font-bold mb-2">Team {team.name}</h1>
                <p className="text-blue-100 mb-4">Learning together, growing together</p>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{teamMembers.length}</div>
                        <div className="text-sm text-blue-100">Members</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{teamProgress?.current_level || 1}</div>
                        <div className="text-sm text-blue-100">Level</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{teamProgress?.total_points || 0}</div>
                        <div className="text-sm text-blue-100">Points</div>
                    </div>
                </div>
            </div>

            {/* Current Mission */}
            {currentMission && (
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <h2 className="text-xl font-bold mb-4">This Week's Mission</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{currentMission.mission_progress?.length || 0}</div>
                            <div className="text-sm text-gray-600">Interactions</div>
                            <div className="text-xs text-gray-500">Need {currentMission.required_interactions}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {new Set(currentMission.mission_progress?.map(p => p.user_id)).size || 0}
                            </div>
                            <div className="text-sm text-gray-600">Contributors</div>
                            <div className="text-xs text-gray-500">Need {currentMission.required_members}</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${currentMission.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                                {currentMission.status === 'completed' ? '✓' : 'In Progress'}
                            </div>
                            <div className="text-sm text-gray-600">Status</div>
                        </div>
                    </div>
                    <p className="text-gray-700">
                        Complete at least {currentMission.required_interactions} different types of cooperative interactions
                        with at least {currentMission.required_members} team members this week.
                    </p>
                    <ul className="list-disc ml-6 mt-3 text-sm text-gray-600 space-y-1">
                        <li>Rule 1: Peer explanation + helpful mark + concept check</li>
                        <li>Rule 2: 2+ editors + 3rd member validator</li>
                        <li>Rule 3: 3+ attendees + each submits reflection</li>
                        <li>Anti-gaming: max one mission credit per member per interaction type/week</li>
                    </ul>
                </div>
            )}

            {/* Create Interaction */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Start a Cooperative Activity</h2>
                <form onSubmit={handleCreateInteraction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Activity Type</label>
                            <select
                                value={newInteraction.type}
                                onChange={(e) => setNewInteraction((p) => ({ ...p, type: e.target.value }))}
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value="peer_explanation">Peer explanation</option>
                                <option value="collaborative_editing">Collaborative problem solving</option>
                                <option value="study_session">Study session</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                value={newInteraction.title}
                                onChange={(e) => setNewInteraction((p) => ({ ...p, title: e.target.value }))}
                                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="e.g., Explain recursion with examples"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description / prompt</label>
                        <textarea
                            value={newInteraction.description}
                            onChange={(e) => setNewInteraction((p) => ({ ...p, description: e.target.value }))}
                            rows={3}
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                    </div>
                    {newInteraction.type === 'study_session' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Scheduled time</label>
                            <input
                                type="datetime-local"
                                value={newInteraction.when}
                                onChange={(e) => setNewInteraction((p) => ({ ...p, when: e.target.value }))}
                                className="mt-1 border border-gray-300 rounded-lg px-3 py-2"
                            />
                        </div>
                    )}
                    <button type="submit" disabled={creating} className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                        {creating ? 'Creating...' : 'Create activity'}
                    </button>
                </form>
            </div>

            {(actionError || actionMessage) && (
                <div className={`rounded-lg p-4 text-sm ${actionError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {actionError || actionMessage}
                </div>
            )}

            {/* Team Members */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Your Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teamMembers.map((member) => (
                        <div key={member.user_id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                {(member.profiles?.full_name || member.profiles?.email)?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">
                                    {member.profiles?.full_name || member.profiles?.email}
                                </div>
                                <div className="text-sm text-gray-500">Team Member</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Interactions */}
            {activeInteractions.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Active Team Activities</h2>
                    <div className="space-y-4">
                        {activeInteractions.map((interaction) => (
                            <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{interaction.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                                        <div className="flex items-center mt-2 space-x-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                interaction.interaction_type === 'peer_explanation' ? 'bg-blue-100 text-blue-800' :
                                                interaction.interaction_type === 'collaborative_editing' ? 'bg-green-100 text-green-800' :
                                                'bg-purple-100 text-purple-800'
                                            }`}>
                                                {interaction.interaction_type.replace('_', ' ')}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {interaction.contributions?.length || 0} contributions
                                            </span>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {interaction.interaction_type === 'peer_explanation' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            const post = interaction.contributions?.find(c => c.contribution_type === 'post');
                                                            if (post) addValidation(interaction.id, post.id, 'helpful', 'This explanation helped me.');
                                                        }}
                                                        className="px-3 py-2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-sm"
                                                    >
                                                        Mark helpful
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="Concept check answer"
                                                            value={quickInputs[interaction.id]?.conceptCheck || ''}
                                                            onChange={(e) => setQuickInput(interaction.id, 'conceptCheck', e.target.value)}
                                                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => addContribution(interaction.id, 'concept_check', quickInputs[interaction.id]?.conceptCheck || '')}
                                                            className="px-3 py-1 rounded bg-indigo-600 text-white text-sm"
                                                        >
                                                            Submit
                                                        </button>
                                                    </div>
                                                </>
                                            )}

                                            {interaction.interaction_type === 'collaborative_editing' && (
                                                <>
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="Your edit"
                                                            value={quickInputs[interaction.id]?.edit || ''}
                                                            onChange={(e) => setQuickInput(interaction.id, 'edit', e.target.value)}
                                                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => addContribution(interaction.id, 'edit', quickInputs[interaction.id]?.edit || '')}
                                                            className="px-3 py-1 rounded bg-green-600 text-white text-sm"
                                                        >
                                                            Add edit
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const firstEdit = interaction.contributions?.find(c => c.contribution_type === 'edit');
                                                            if (firstEdit) addValidation(interaction.id, firstEdit.id, 'validation', 'Validated final version.');
                                                        }}
                                                        className="px-3 py-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm"
                                                    >
                                                        Validate final version
                                                    </button>
                                                </>
                                            )}

                                            {interaction.interaction_type === 'study_session' && (
                                                <>
                                                    <button
                                                        onClick={() => addContribution(interaction.id, 'attend', 'attended')}
                                                        className="px-3 py-2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-sm"
                                                    >
                                                        Mark attendance
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="1 reflection sentence"
                                                            value={quickInputs[interaction.id]?.reflection || ''}
                                                            onChange={(e) => setQuickInput(interaction.id, 'reflection', e.target.value)}
                                                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                                                        />
                                                        <button
                                                            onClick={() => addContribution(interaction.id, 'reflection', quickInputs[interaction.id]?.reflection || '')}
                                                            className="px-3 py-1 rounded bg-violet-600 text-white text-sm"
                                                        >
                                                            Submit
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => verifyInteractionProgress(interaction.id)}
                                            className="mt-3 px-3 py-2 rounded bg-gray-900 text-white text-sm"
                                        >
                                            Verify interaction & record mission progress
                                        </button>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        {new Date(interaction.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Unlocked Features */}
            {teamProgress && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Unlocked Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableUnlocks
                            .filter(unlock => unlock.required_level <= teamProgress.current_level)
                            .map((unlock) => (
                                <div key={unlock.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                                        ✓
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{unlock.name}</div>
                                        <div className="text-sm text-gray-600">{unlock.description}</div>
                                    </div>
                                </div>
                            ))}
                    </div>
                    {availableUnlocks.filter(unlock => unlock.required_level > teamProgress.current_level).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <h3 className="font-medium text-gray-900 mb-2">Coming Soon</h3>
                            <div className="space-y-2">
                                {availableUnlocks
                                    .filter(unlock => unlock.required_level > teamProgress.current_level)
                                    .slice(0, 2)
                                    .map((unlock) => (
                                        <div key={unlock.id} className="flex items-center space-x-3 p-2 text-gray-500">
                                            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                                                {unlock.required_level}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{unlock.name}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {capabilityUnlocks.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Team Capability Unlocks</h2>
                    <div className="space-y-2">
                        {capabilityUnlocks.slice(0, 5).map((u) => (
                            <div key={u.id} className="p-3 border border-gray-200 rounded-lg">
                                <div className="font-medium text-gray-900">{u.capability_key.replaceAll('_', ' ')}</div>
                                <div className="text-xs text-gray-500">Unlocked on {new Date(u.unlocked_at).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
