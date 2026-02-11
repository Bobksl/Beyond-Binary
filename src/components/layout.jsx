import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './sidebar';
import AIChatbox from './AIChatbox';
import { user } from '@/api/entities';

const Layout = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await user.me();
        setIsAuthenticated(!!me);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const onLoginPage = location.pathname === '/login';
  const onOnboardingPage = location.pathname === '/onboarding';

  // Auth entry and onboarding should not show the app sidebar.
  if (onLoginPage || onOnboardingPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Outlet />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow p-8 text-center border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to UniMates</h1>
          <p className="mt-3 text-gray-600">
            Please log in or sign up to access your dashboard, onboarding, and team features.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Login / Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* This is where your page content will "plug in" */}
        <Outlet />
      </main>
      {/* AI Chatbox - only shown for authenticated users */}
      <AIChatbox />
    </div>
  );
};

export default Layout;
