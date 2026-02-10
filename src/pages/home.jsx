import React, { useState, useEffect } from 'react';
import { teams, missions, interactions, unlocks } from '@/api/entities';

const Home = () => {
    const [team, setTeam] = useState(null);
    const [currentMission, setCurrentMission] = useState(null);
    const [teamInteractions, setTeamInteractions] = useState([]);
    const [teamProgress, setTeamProgress] = useState(null);
    const [availableUnlocks, setAvailableUnlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTeamData = async () => {
            try {
                const [teamData, missionData, interactionsData, progressData, unlocksData] = await Promise.all([
                    teams.myTeam(),
                    teams.myTeam().then(t => t ? missions.getCurrentMission(t.id) : null),
                    teams.myTeam().then(t => t ? interactions.getTeamInteractions(t.id) : []),
                    teams.myTeam().then(t => t ? teams.getProgress(t.id) : null),
                    unlocks.getAvailable()
                ]);

                setTeam(teamData);
                setCurrentMission(missionData);
                setTeamInteractions(interactionsData);
                setTeamProgress(progressData);
                setAvailableUnlocks(unlocksData);
            } catch (error) {
                console.error('Error loading team data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTeamData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-12">
                <h1 className="text-3xl font-bold mb-4">Welcome to Beyond Binary</h1>
                <p className="text-lg text-gray-700 mb-6">
                    You're being assigned to a learning team. Please check back soon!
                </p>
                <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded"></div>
            </div>
        );
    }

    const teamMembers = team.team_members || [];
    const completedInteractions = teamInteractions.filter(i => i.status === 'completed').length;
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
        </div>
    );
};

export default Home;
