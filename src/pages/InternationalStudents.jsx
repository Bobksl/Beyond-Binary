import { useMemo, useState } from 'react';

const nationalityResources = {
  Singaporean: [
    { title: 'Visa / Pass Information', url: '' },
    { title: 'Campus Support Services', url: '' },
    { title: 'Housing Information', url: '' },
  ],
  Indian: [
    { title: 'Visa / Pass Information', url: '' },
    { title: 'Scholarship Information', url: '' },
    { title: 'Student Community Groups', url: '' },
  ],
  Chinese: [
    { title: 'Visa / Pass Information', url: '' },
    { title: 'Banking Setup Guide', url: '' },
    { title: 'Healthcare & Insurance', url: '' },
  ],
  Indonesian: [
    { title: 'Visa / Pass Information', url: '' },
    { title: 'Accommodation Resources', url: '' },
    { title: 'Important University Offices', url: '' },
  ],
  Malaysian: [
    { title: 'Visa / Pass Information', url: '' },
    { title: 'Orientation Checklist', url: '' },
    { title: 'Emergency Contacts', url: '' },
  ],
};

const InternationalStudents = () => {
  const nationalities = useMemo(() => Object.keys(nationalityResources), []);
  const [selectedNationality, setSelectedNationality] = useState(nationalities[0]);

  const links = nationalityResources[selectedNationality] || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">For International Students</h1>
        <p className="text-gray-600">Select your nationality to view important resource links.</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
          Nationality
        </label>
        <select
          id="nationality"
          value={selectedNationality}
          onChange={(e) => setSelectedNationality(e.target.value)}
          className="w-full md:w-80 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {nationalities.map((nationality) => (
            <option key={nationality} value={nationality}>
              {nationality}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Links</h2>

        <ul className="space-y-3">
          {links.map((link, index) => (
            <li key={`${selectedNationality}-${index}`}>
              <a href={link.url} className="text-blue-600 hover:text-blue-800 underline">
                {link.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InternationalStudents;