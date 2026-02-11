import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { user } from '@/api/entities';
import { COUNTRIES, flagImageUrl } from '@/utils/countries';

const PERSONALITY_OPTIONS = [
  { value: 'Analytical', label: 'Analytical', emoji: '🧠' },
  { value: 'Collaborative', label: 'Collaborative', emoji: '🤝' },
  { value: 'Creative', label: 'Creative', emoji: '🎨' },
  { value: 'Practical', label: 'Practical', emoji: '🛠️' },
];

const GENDER_OPTIONS = [
  { value: 'Female', label: 'Female', emoji: '👩' },
  { value: 'Male', label: 'Male', emoji: '👨' },
  { value: 'Non-binary', label: 'Non-binary', emoji: '🧑' },
  { value: 'Prefer not to say', label: 'Prefer not to say', emoji: '🙊' },
];

const INTEREST_OPTIONS = [
  { value: 'AI / Machine Learning', emoji: '🤖' },
  { value: 'Data Science', emoji: '📊' },
  { value: 'Cybersecurity', emoji: '🔐' },
  { value: 'Web Development', emoji: '🌐' },
  { value: 'Mobile Development', emoji: '📱' },
  { value: 'Cloud Computing', emoji: '☁️' },
  { value: 'Game Development', emoji: '🎮' },
  { value: 'UI/UX Design', emoji: '🖌️' },
  { value: 'Entrepreneurship', emoji: '🚀' },
  { value: 'Research & Academia', emoji: '🔬' },
  { value: 'Public Speaking', emoji: '🎤' },
  { value: 'Student Leadership', emoji: '🧭' },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const slides = ['nationality', 'major', 'year_of_study', 'personality', 'gender', 'interests'];
  const [form, setForm] = useState({
    nationality: '',
    major: '',
    year_of_study: '',
    interests: [],
    personality: '',
    gender: '',
  });
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
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

  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;

  const selectedCountry = useMemo(
    () => COUNTRIES.find((country) => country.name === form.nationality),
    [form.nationality]
  );

  const getSlideError = () => {
    switch (currentSlide) {
      case 'nationality':
        return 'Please select your nationality before continuing.';
      case 'major':
        return 'Please enter your major before continuing.';
      case 'year_of_study':
        return 'Please select your current year of study before continuing.';
      case 'personality':
        return 'Please choose your learning personality before continuing.';
      case 'gender':
        return 'Please select a gender option before continuing.';
      case 'interests':
        if (form.interests.length < 3) return 'Please select at least 3 interests.';
        if (form.interests.length > 4) return 'Please keep interests to a maximum of 4.';
        return 'Please select 3 to 4 interests before continuing.';
      default:
        return 'Please complete this step before continuing.';
    }
  };

  const isCurrentSlideValid = useMemo(() => {
    switch (currentSlide) {
      case 'nationality':
        return !!form.nationality;
      case 'major':
        return !!form.major;
      case 'year_of_study':
        return !!form.year_of_study;
      case 'personality':
        return !!form.personality;
      case 'gender':
        return !!form.gender;
      case 'interests':
        return form.interests.length >= 3 && form.interests.length <= 4;
      default:
        return false;
    }
  }, [currentSlide, form]);

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

    // Allow Enter key to advance slides instead of triggering final submit early.
    if (!isLastSlide) {
      goNext();
      return;
    }

    if (!canSubmit) {
      setError('Submission incomplete: fill all required fields and select 3 to 4 interests.');
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

  const goNext = () => {
    setError('');
    if (!isCurrentSlideValid) {
      setError(getSlideError());
      return;
    }
    setCurrentSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  const goBack = () => {
    setError('');
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome! Let’s build your buddy profile</h1>
      <p className="text-sm text-gray-600 mt-2">
        This survey helps us place you into a balanced learning team and assign cooperative missions.
      </p>

      {error && <div className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded p-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5 mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">Step {currentSlideIndex + 1} of {slides.length}</p>

        <div className="min-h-[280px] rounded-xl border border-gray-200 p-5 bg-gray-50">
          {currentSlide === 'nationality' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800">What is your nationality?</label>
              <p className="text-sm text-gray-600 mt-1">This helps tailor support resources and team matching.</p>
              <select
                value={form.nationality}
                onChange={(e) => onChange('nationality', e.target.value)}
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                required
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.iso} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              {selectedCountry && (
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded px-3 py-2">
                  <img src={flagImageUrl(selectedCountry.iso, 20)} alt={`${selectedCountry.name} flag`} className="w-5 h-4 object-cover rounded-sm" />
                  <span>{selectedCountry.name}</span>
                </div>
              )}
            </div>
          )}

          {currentSlide === 'major' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800">What is your major?</label>
              <p className="text-sm text-gray-600 mt-1">We use this to build academically compatible teams.</p>
              <input
                type="text"
                value={form.major}
                onChange={(e) => onChange('major', e.target.value)}
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                placeholder="e.g., Computer Science"
                required
              />
            </div>
          )}

          {currentSlide === 'year_of_study' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800">Which year are you in?</label>
              <p className="text-sm text-gray-600 mt-1">Year proximity improves peer support quality.</p>
              <select
                value={form.year_of_study}
                onChange={(e) => onChange('year_of_study', e.target.value)}
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
          )}

          {currentSlide === 'personality' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800">How would you describe your learning personality?</label>
              <p className="text-sm text-gray-600 mt-1">This helps with collaboration style balancing.</p>
              <select
                value={form.personality}
                onChange={(e) => onChange('personality', e.target.value)}
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                required
              >
                <option value="">Select personality</option>
                {PERSONALITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentSlide === 'gender' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800">What is your gender?</label>
              <p className="text-sm text-gray-600 mt-1">Optional for matching balance and inclusion preferences.</p>
              <select
                value={form.gender}
                onChange={(e) => onChange('gender', e.target.value)}
                className="mt-4 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                required
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentSlide === 'interests' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-lg font-semibold text-gray-800">Pick 3 to 4 interests</label>
                <span className="text-xs text-gray-500">Selected: {form.interests.length}/4</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">These are used for team compatibility and mission personalization.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = form.interests.includes(interest.value);
                  return (
                    <button
                      key={interest.value}
                      type="button"
                      onClick={() => toggleInterest(interest.value)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {interest.emoji} {interest.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={currentSlideIndex === 0 || loading}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>

          {isLastSlide ? (
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving profile and finding your team...' : 'Complete onboarding'}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Onboarding;
