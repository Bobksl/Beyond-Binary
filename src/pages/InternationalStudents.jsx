import { useEffect, useMemo, useState } from 'react';
import { user } from '@/api/entities';
import {
  COUNTRIES,
  INTERNATIONAL_STUDENT_LINKS,
  flagImageUrl,
  isSingaporeNationality,
  normalizeNationalityToIso,
} from '@/utils/countries';

const InternationalStudents = () => {
  const [profile, setProfile] = useState(null);
  const [selectedIso, setSelectedIso] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await user.profile();
        setProfile(data);

        const detectedIso = normalizeNationalityToIso(data?.nationality);
        setSelectedIso(detectedIso || '');
      } catch (error) {
        console.error('Failed to load profile for international student page:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const selectedCountry = useMemo(
    () => COUNTRIES.find((country) => country.iso === selectedIso),
    [selectedIso]
  );

  const isSingaporean = selectedIso === 'SG' || isSingaporeNationality(profile?.nationality);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">For International Students</h1>
        <p className="text-gray-600">
          Official NTU resources are available for all non-Singaporean students.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
          Country / Nationality
        </label>
        <select
          id="nationality"
          value={selectedIso}
          onChange={(e) => setSelectedIso(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select country</option>
          {COUNTRIES.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {COUNTRIES.length} countries/regions available.
        </p>
        {selectedCountry && (
          <div className="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <img src={flagImageUrl(selectedCountry.iso, 20)} alt={`${selectedCountry.name} flag`} className="w-5 h-4 object-cover rounded-sm" />
            <span>{selectedCountry.name}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {isSingaporean ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700">
            This section is for international students only. Since your nationality is set to Singapore,
            these links are hidden.
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Important Links</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedCountry
                ? `Showing international resources for ${selectedCountry.name}.`
                : 'Select your country to personalize the page. The links below apply to all non-Singaporean students.'}
            </p>

            <ul className="space-y-3">
              {INTERNATIONAL_STUDENT_LINKS.map((link, index) => (
                <li key={`${link.url}-${index}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default InternationalStudents;