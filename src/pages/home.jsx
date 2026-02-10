import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { user, buddySystem, activity, reward } from '@/api/entities';

const Home = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [myBuddyRows, setMyBuddyRows] = useState([]);
    const [myActivities, setMyActivities] = useState([]);
    const [myRewards, setMyRewards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
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

                const buddyRows = await buddySystem.getMine();
                setMyBuddyRows(buddyRows);

                const buddyIds = buddyRows.map((row) => row.id);
                const [activitiesData, rewardsData] = await Promise.all([
                    activity.getByBuddyIds(buddyIds),
                    reward.getMine(),
                ]);

                setMyActivities(activitiesData);
                setMyRewards(rewardsData);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

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

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
                <p className="text-blue-100 mb-4">Overview of your profile, activity, and rewards</p>
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{myBuddyRows.length}</div>
                        <div className="text-sm text-blue-100">Buddy Records</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{myActivities.length}</div>
                        <div className="text-sm text-blue-100">Activities</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{myRewards.reduce((sum, r) => sum + (r.points || 0), 0)}</div>
                        <div className="text-sm text-blue-100">Reward Points</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Recent Rewards</h2>
                {myRewards.length === 0 ? (
                    <p className="text-gray-600">No rewards yet.</p>
                ) : (
                    <div className="space-y-3">
                        {myRewards.slice(0, 8).map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">{item.description || 'Reward earned'}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">+{item.points || 0} pts</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
                {myActivities.length === 0 ? (
                    <p className="text-gray-600">No activities found for your buddy records.</p>
                ) : (
                    <div className="space-y-3">
                        {myActivities.slice(0, 8).map((item) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Activity #{item.id.slice(0, 8)}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{item.points || 0} pts</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
