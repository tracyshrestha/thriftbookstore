import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/books', label: 'Books', icon: '📚' },
    { path: '/my-books', label: 'My Books', icon: '🔖' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null; // hide sidebar if not logged in

  return (
    <div className="w-64 bg-gray-800 text-white min-h-screen flex flex-col justify-between">
      <div>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Book Library</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
        >
          <span className="mr-3 text-lg">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
