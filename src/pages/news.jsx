import React, { useState, useEffect } from 'react';
import { reward } from '@/api/entities';

const News = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUpdates = async () => {
            try {
                const rewards = await reward.getMine();
                const normalized = (rewards || []).map((r) => ({
                    id: r.id,
                    title: r.description || 'Reward update',
                    content: `You earned ${r.points || 0} point(s).`,
                    created_at: r.created_at,
                }));

                setUpdates(normalized);
            } catch (error) {
                console.error('Error loading updates:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUpdates();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My News Updates</h1>
                <p className="text-lg text-gray-600">Recent news from my university</p>
            </div>

            {/* News List */}
            <div className="space-y-6">
                {updates.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No updates yet</h3>
                        <p className="text-gray-500">News updates will appear here soon. Thank you for your attention to this matter!</p>
                    </div>
                ) : (
                    updates.map((item) => (
                        <article key={item.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h2>
                                    <p className="text-gray-700 mb-4 leading-relaxed">{item.content}</p>
                                    <div className="text-sm text-gray-600">
                                        Source: reward table
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};

export default News;