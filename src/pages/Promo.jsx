import { useEffect, useMemo, useState } from 'react';
import { promo as promoAPI } from '@/api/entities';

const TAB_CONFIG = [
  { key: 'events', label: 'Events' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'individual_events', label: 'Individual Events' },
];

const Promo = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');

  useEffect(() => {
    const loadPromo = async () => {
      try {
        const data = await promoAPI.getAll();
        setRecords(data || []);
      } catch (error) {
        console.error('Error loading promo data:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadPromo();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((item) => item.category === activeTab);
  }, [records, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Promo</h1>
        <p className="text-lg text-gray-600">
          Clubs can promote themselves and share upcoming events here.
        </p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-6">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No promo posts yet</h2>
            <p className="text-gray-600">There are no records in this category right now.</p>
          </div>
        ) : (
          filteredRecords.map((item) => (
            <article key={item.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{item.title || 'Untitled Promo'}</h2>
                  <p className="text-gray-700 mt-2 whitespace-pre-line">
                    {item.description || item.content || 'No description provided.'}
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    By {item.club_name || item.organizer_name || 'Unknown organizer'}
                  </p>
                </div>
                <div className="text-sm text-gray-500 shrink-0">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default Promo;