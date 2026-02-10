import React, { useState, useEffect } from 'react';
import { news as newsAPI } from '@/api/entities';

const News = () => {
    const [newsItems, setNewsItems] = useState([]);
    const [featuredNews, setFeaturedNews] = useState([]);
    const [myBookmarks, setMyBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const loadNews = async () => {
            try {
                const [allNews, featured, bookmarks] = await Promise.all([
                    newsAPI.getAll(),
                    newsAPI.getFeatured(),
                    newsAPI.getMyBookmarks()
                ]);

                setNewsItems(allNews);
                setFeaturedNews(featured);
                setMyBookmarks(bookmarks);
            } catch (error) {
                console.error('Error loading news:', error);
            } finally {
                setLoading(false);
            }
        };

        loadNews();
    }, []);

    const handleBookmark = async (newsId) => {
        try {
            const isBookmarked = await newsAPI.toggleBookmark(newsId);

            // Update the local state
            if (isBookmarked) {
                const newsItem = newsItems.find(item => item.id === newsId);
                if (newsItem) {
                    setMyBookmarks(prev => [...prev, { ...newsItem, bookmark_id: Date.now(), bookmarked_at: new Date() }]);
                }
            } else {
                setMyBookmarks(prev => prev.filter(item => item.id !== newsId));
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    };

    const isBookmarked = (newsId) => {
        return myBookmarks.some(bookmark => bookmark.id === newsId);
    };

    const displayedNews = activeTab === 'bookmarks' ? myBookmarks : newsItems;

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus News & Updates</h1>
                <p className="text-lg text-gray-600">Stay informed with the latest announcements and news</p>
            </div>

            {/* Featured News */}
            {featuredNews.length > 0 && activeTab === 'all' && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Featured</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {featuredNews.map((item) => (
                            <div key={item.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-blue-100 mb-3 line-clamp-3">{item.content}</p>
                                <div className="flex items-center justify-between text-sm text-blue-100">
                                    <span>{item.profiles?.full_name || 'Admin'}</span>
                                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'all'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        All News
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'bookmarks'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        My Bookmarks ({myBookmarks.length})
                    </button>
                </nav>
            </div>

            {/* News List */}
            <div className="space-y-6">
                {displayedNews.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            {activeTab === 'bookmarks' ? (
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                            ) : (
                                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab === 'bookmarks' ? 'No bookmarks yet' : 'No news available'}
                        </h3>
                        <p className="text-gray-500">
                            {activeTab === 'bookmarks'
                                ? 'Bookmark important news items to find them here later.'
                                : 'Check back later for updates and announcements.'
                            }
                        </p>
                    </div>
                ) : (
                    displayedNews.map((item) => (
                        <article key={item.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        {item.is_featured && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Featured
                                            </span>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            {new Date(item.published_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h2>
                                    <p className="text-gray-700 mb-4 leading-relaxed">{item.content}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                            By {item.profiles?.full_name || 'Administrator'}
                                        </div>
                                        {activeTab === 'all' && (
                                            <button
                                                onClick={() => handleBookmark(item.id)}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                                    isBookmarked(item.id)
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                <svg className="w-4 h-4 mr-1" fill={isBookmarked(item.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                                {isBookmarked(item.id) ? 'Bookmarked' : 'Bookmark'}
                                            </button>
                                        )}
                                        {activeTab === 'bookmarks' && (
                                            <div className="text-sm text-gray-500">
                                                Bookmarked {new Date(item.bookmarked_at).toLocaleDateString()}
                                            </div>
                                        )}
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