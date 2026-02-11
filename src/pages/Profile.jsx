import React, { useState, useEffect } from 'react';
import { user, teams, unlocks } from '@/api/entities';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
  const [team, setTeam] = useState(null);
  const [teamProgress, setTeamProgress] = useState(null);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [formData, setFormData] = useState({
    bio: '',
    hobbies: [],
    activity_preferences: [],
    buddy_preferences: [],
    preferred_communication: 'chat',
    academic_goals: '',
    social_interests: [],
  });

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // 1. Check authentication
      const currentUser = await user.me();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // 2. Fetch user profile
        const userProfile = await user.profile();
        if (!userProfile) {
          // Profile may not exist; redirect to onboarding?
          // For now, just set empty profile
          setLoading(false);
          return;
        }
        setProfile(userProfile);
        setFormData({
          bio: userProfile.bio || '',
          hobbies: userProfile.hobbies || [],
          activity_preferences: userProfile.activity_preferences || [],
          buddy_preferences: userProfile.buddy_preferences || [],
          preferred_communication: userProfile.preferred_communication || 'chat',
          academic_goals: userProfile.academic_goals || '',
          social_interests: userProfile.social_interests || [],
        });

        // 3. Fetch team and gamification data
        const teamData = await teams.myTeam();
        setTeam(teamData);
        if (teamData) {
          const progress = await teams.getProgress(teamData.id);
          setTeamProgress(progress);
          const badges = await unlocks.getTeamUnlocks(teamData.id);
          setAvailableBadges(badges);
        }
      } catch (error) {
        console.error('Failed to fetch profile or team data:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetch();
  }, [navigate]);

  const handleSave = async () => {
    try {
      await user.updateProfile(formData);
      setEditMode(false);
      // Refresh profile
      const updated = await user.profile();
      setProfile(updated);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleInterestToggle = (category, value) => {
    setFormData(prev => {
      const current = [...prev[category]];
      const index = current.indexOf(value);
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(value);
      }
      return { ...prev, [category]: current };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'interests', label: 'Interests', icon: '🎯' },
    { id: 'academic', label: 'Academic', icon: '📚' },
    { id: 'activities', label: 'Activities', icon: '🎮' },
    { id: 'gamification', label: 'Gamification', icon: '🏆' },
    { id: 'buddy', label: 'Buddy Matching', icon: '🤝' },
  ];

  const activityOptions = ['Study Sessions', 'Game Nights', 'Movie Nights', 'Sports', 'Hiking', 'Café Hangouts', 'Volunteering', 'Workshops'];
  const hobbyOptions = ['Photography', 'Music', 'Reading', 'Gaming', 'Cooking', 'Travel', 'Art', 'Fitness', 'Writing', 'Coding'];
  const socialInterestOptions = ['Networking', 'Deep Conversations', 'Casual Chats', 'Group Events', 'One-on-One', 'Online', 'In-Person'];

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My UniMates Profile</h1>
          <p className="text-gray-600 mt-2">Manage your profile, interests, and buddy matching preferences.</p>
        </div>
        <div className="flex gap-3">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                {editMode ? (
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="Tell others about yourself..."
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">{profile?.bio || 'No bio provided.'}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Communication</label>
                {editMode ? (
                  <select
                    value={formData.preferred_communication}
                    onChange={e => setFormData({ ...formData, preferred_communication: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3"
                  >
                    <option value="chat">Chat</option>
                    <option value="video">Video Call</option>
                    <option value="in_person">In Person</option>
                    <option value="mixed">Mixed</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg capitalize">{profile?.preferred_communication || 'Not specified'}</div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hobbies</label>
              {editMode ? (
                <div className="flex flex-wrap gap-2">
                  {hobbyOptions.map(hobby => (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => handleInterestToggle('hobbies', hobby)}
                      className={`px-3 py-2 rounded-full border ${formData.hobbies.includes(hobby) ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.hobbies?.map(hobby => (
                    <span key={hobby} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {hobby}
                    </span>
                  ))}
                  {(!profile?.hobbies || profile.hobbies.length === 0) && 'No hobbies listed.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'interests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Activity Preferences</h3>
              {editMode ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {activityOptions.map(activity => (
                    <label key={activity} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.activity_preferences.includes(activity)}
                        onChange={() => handleInterestToggle('activity_preferences', activity)}
                        className="rounded"
                      />
                      <span>{activity}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.activity_preferences?.map(act => (
                    <span key={act} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {act}
                    </span>
                  ))}
                  {(!profile?.activity_preferences || profile.activity_preferences.length === 0) && 'No activity preferences.'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Social Interests</h3>
              {editMode ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {socialInterestOptions.map(interest => (
                    <label key={interest} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.social_interests.includes(interest)}
                        onChange={() => handleInterestToggle('social_interests', interest)}
                        className="rounded"
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile?.social_interests?.map(int => (
                    <span key={int} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                      {int}
                    </span>
                  ))}
                  {(!profile?.social_interests || profile.social_interests.length === 0) && 'No social interests specified.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major</label>
                <div className="p-3 bg-gray-50 rounded-lg">{profile?.major || 'Not specified'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                <div className="p-3 bg-gray-50 rounded-lg">{profile?.year_of_study ? `Year ${profile.year_of_study}` : 'Not specified'}</div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Goals</label>
              {editMode ? (
                <textarea
                  value={formData.academic_goals}
                  onChange={e => setFormData({ ...formData, academic_goals: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-3"
                  placeholder="Describe your academic goals..."
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">{profile?.academic_goals || 'No academic goals provided.'}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personality Type</label>
              <div className="p-3 bg-gray-50 rounded-lg">{profile?.personality || 'Not specified'}</div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Upcoming Activities</h3>
              <p className="text-blue-700">Activities you create or join will appear here.</p>
              {profile?.activity_preferences && profile.activity_preferences.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm text-blue-700 font-medium">Based on your preferences:</p>
                  <ul className="mt-2 space-y-1 text-blue-600">
                    {profile.activity_preferences.slice(0, 3).map((pref, idx) => (
                      <li key={idx}>• {pref} – Join a session soon!</li>
                    ))}
                  </ul>
                  <p className="text-sm text-blue-500 mt-3">Set up your first activity to get started.</p>
                </div>
              ) : (
                <div className="mt-4 text-sm text-blue-600">
                  <p>No activity preferences set yet. Edit your profile to tell us what you enjoy.</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Activity History</h3>
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="text-4xl mb-4">📅</div>
                <h4 className="text-xl font-semibold text-gray-700">No activities yet</h4>
                <p className="text-gray-600 mt-2 max-w-md mx-auto">
                  Once you participate in team activities, your history will appear here.
                </p>
                {team ? (
                  <button
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => {/* TODO: navigate to create activity */}}
                  >
                    Create Activity
                  </button>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">Join a team to start participating in activities.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gamification' && (
          <div className="space-y-6">
            {!team ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700">Join a Team</h3>
                <p className="text-gray-600 mt-2">You need to be part of a team to unlock gamification features.</p>
                <p className="text-sm text-gray-500 mt-1">Once you join a team, your points, badges, and level will appear here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
                    <div className="text-4xl font-bold">{teamProgress?.total_points || 0}</div>
                    <div className="text-lg">Total Points</div>
                    <div className="text-sm opacity-90">Earned through team activities</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl p-6">
                    <div className="text-4xl font-bold">{availableBadges.length}</div>
                    <div className="text-lg">Badges Earned</div>
                    <div className="text-sm opacity-90">
                      {availableBadges.length > 0
                        ? availableBadges.slice(0, 3).map(b => b.name).join(', ')
                        : 'No badges yet'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6">
                    <div className="text-4xl font-bold">Level {teamProgress?.current_level || 1}</div>
                    <div className="text-lg">Current Level</div>
                    <div className="text-sm opacity-90">Keep earning points to level up</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Rewards</h3>
                  {availableBadges.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No badges earned yet. Complete team missions to earn rewards.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {availableBadges.slice(0, 4).map(badge => (
                        <div key={badge.id} className="border rounded-lg p-4 text-center">
                          <div className="text-3xl mb-2">🏅</div>
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-xs text-gray-500">Unlocked at level {badge.required_level}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'buddy' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-2">AI Buddy Matching</h3>
              <p className="text-purple-700 mb-4">Our AI algorithm matches you with compatible buddies based on your profile, interests, and activity preferences.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-800">Profile Completeness</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{
                        width: `${
                          profile
                            ? Math.min(
                                100,
                                (profile.bio ? 20 : 0) +
                                  (profile.hobbies?.length ? 15 : 0) +
                                  (profile.activity_preferences?.length ? 15 : 0) +
                                  (profile.buddy_preferences?.length ? 20 : 0) +
                                  (profile.academic_goals ? 15 : 0) +
                                  (profile.social_interests?.length ? 15 : 0)
                              )
                            : 0
                        }%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {profile
                      ? `Complete your profile to improve match accuracy (${Math.min(
                          100,
                          (profile.bio ? 20 : 0) +
                            (profile.hobbies?.length ? 15 : 0) +
                            (profile.activity_preferences?.length ? 15 : 0) +
                            (profile.buddy_preferences?.length ? 20 : 0) +
                            (profile.academic_goals ? 15 : 0) +
                            (profile.social_interests?.length ? 15 : 0)
                        )}%)`
                      : 'Profile loading...'}
                  </div>
                </div>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Buddy Preferences</h3>
              {editMode ? (
                <div>
                  <textarea
                    value={formData.buddy_preferences.join(', ')}
                    onChange={e => setFormData({ ...formData, buddy_preferences: e.target.value.split(', ') })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg p-3"
                    placeholder="e.g., same major, similar hobbies, prefers study sessions"
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter comma-separated preferences.</p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  {profile?.buddy_preferences?.length > 0
                    ? profile.buddy_preferences.map((pref, idx) => (
                        <div key={idx} className="mb-1">• {pref}</div>
                      ))
                    : 'No buddy preferences set.'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Suggested Matches</h3>
              {!profile || !profile.buddy_preferences || profile.buddy_preferences.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="text-5xl mb-4">🤝</div>
                  <h4 className="text-xl font-semibold text-gray-700">Set your buddy preferences</h4>
                  <p className="text-gray-600 mt-2 max-w-md mx-auto">
                    Tell us what you're looking for in a buddy, and our AI will suggest compatible matches.
                  </p>
                  <button
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    onClick={() => setEditMode(true)}
                  >
                    Set Preferences
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3"></div>
                      <div className="font-bold">Potential Match {i}</div>
                      <div className="text-sm text-gray-500">Based on your interests</div>
                      <div className="mt-3 text-sm">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {profile.activity_preferences?.[0] || 'Study Sessions'}
                        </span>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded ml-1">
                          {profile.hobbies?.[0] || 'Hiking'}
                        </span>
                      </div>
                      <button className="mt-4 w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 pt-6 border-t">
        <div className="text-sm text-gray-500">
          <p>Your profile visibility: <span className="font-medium">Visible to buddies and matched users</span></p>
          <p>Last updated: {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;