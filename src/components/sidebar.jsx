import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { user } from '@/api/entities'; // Ensure path is correct

const Sidebar = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  // 1. Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await user.me();
        setCurrentUser(data);
      } catch (err) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // 2. Logout Handler
  const handleLogout = async () => {
    try {
      await user.logout();
      setCurrentUser(null);
      navigate('/'); // Redirect to home
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6 font-bold text-xl text-blue-600 border-b">
        My App
      </div>

      <nav className="p-4 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* 3. Conditional Bottom Section */}
      <div className="mt-auto p-4 border-t border-gray-100">
        {currentUser ? (
          <div className="space-y-3">
            <div className="px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">Logged in as:</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {currentUser.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
            >
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `block w-full text-center px-4 py-2 rounded-lg font-medium border border-blue-600 transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`
            }
          >
            Login / Sign Up
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;