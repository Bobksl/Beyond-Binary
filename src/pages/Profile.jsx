import React, { useState, useEffect } from 'react';
import { user } from '@/api/entities';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [editMode, setEditMode] = useState(false);
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
    const fetchData = async () => {
      try {
        const userProfile = await user.profile();
        setProfile(userProfile);
        if (userProfile) {
          setFormData({
            bio: userProfile.bio || '',
            hobbies: userProfile.hobbies || [],
            activity_preferences: userProfile.activity_preferences || [],
            buddy_preferences: userProfile.buddy_preferences || [],
            preferred_communication: userProfile.preferred_communication || 'chat',
            academic_goals: userProfile.academic_goals || '',
            social_interests: userProfile.social_interests || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
              <p className="text-blue-700">Your created and joined activities will appear here once activity tracking is connected.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Activity History</h3>
              <div className="p-4 border rounded-lg text-sm text-gray-600">
                No activity history available yet.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gamification' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
                <div className="text-4xl font-bold">--</div>
                <div className="text-lg">Total Points</div>
                <div className="text-sm opacity-90">No points data yet</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl p-6">
                <div className="text-4xl font-bold">--</div>
                <div className="text-lg">Badges Earned</div>
                <div className="text-sm opacity-90">No badges data yet</div>
              </div>
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-6">
                <div className="text-4xl font-bold">--</div>
                <div className="text-lg">Current Level</div>
                <div className="text-sm opacity-90">No level data yet</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Rewards</h3>
              <div className="p-4 border rounded-lg text-sm text-gray-600">
                No rewards to display yet.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buddy' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-2">AI Buddy Matching</h3>
              <p className="text-purple-700">Buddy matching insights will appear here after matching data is available.</p>
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
              <div className="p-4 border rounded-lg text-sm text-gray-600">
                No suggested matches available yet.
              </div>
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