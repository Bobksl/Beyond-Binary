import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user } from '@/api/entities';

const INTEREST_OPTIONS = [
  'AI / Machine Learning',
  'Data Science',
  'Cybersecurity',
  'Web Development',
  'Mobile Development',
  'Cloud Computing',
  'Game Development',
  'UI/UX Design',
  'Entrepreneurship',
  'Research & Academia',
  'Public Speaking',
  'Student Leadership',
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nationality: '',
    major: '',
    year_of_study: '',
    interests: [],
    personality: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return (
      form.nationality &&
      form.major &&
      form.year_of_study &&
      form.personality &&
      form.gender &&
      form.interests.length >= 3 &&
      form.interests.length <= 4
    );
  }, [form]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const selected = prev.interests.includes(interest);
      if (selected) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      }
      if (prev.interests.length >= 4) return prev;
      return { ...prev, interests: [...prev.interests, interest] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('Please complete all fields and select 3 to 4 interests.');
      return;
    }

    try {
      setLoading(true);
      await user.completeOnboarding({
        ...form,
        year_of_study: Number(form.year_of_study),
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to submit onboarding survey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome! Let’s build your buddy profile</h1>
      <p className="text-sm text-gray-600 mt-2">
        This survey helps us place you into a balanced learning team and assign cooperative missions.
      </p>

      {error && <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nationality</label>
            <input
              type="text"
              value={form.nationality}
              onChange={(e) => onChange('nationality', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Singaporean"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Major</label>
            <input
              type="text"
              value={form.major}
              onChange={(e) => onChange('major', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="e.g., Computer Science"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Year of study</label>
            <select
              value={form.year_of_study}
              onChange={(e) => onChange('year_of_study', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Personality</label>
            <select
              value={form.personality}
              onChange={(e) => onChange('personality', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select personality</option>
              <option value="Analytical">Analytical</option>
              <option value="Collaborative">Collaborative</option>
              <option value="Creative">Creative</option>
              <option value="Practical">Practical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => onChange('gender', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Interests (select 3 to 4)</label>
            <span className="text-xs text-gray-500">Selected: {form.interests.length}/4</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = form.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                    selected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving profile and finding your team...' : 'Complete onboarding'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Onboarding;
