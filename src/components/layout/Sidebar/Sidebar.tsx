import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ROUTES } from "@/constants";
import { ChevronUp, LogOut, Settings } from "lucide-react";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userMenuItems = [
    { path: ROUTES.DASHBOARD, label: "Dashboard", icon: "📊" },
    { path: ROUTES.BOOKS, label: "Browse Books", icon: "📚" },
    { path: ROUTES.MY_BOOKS, label: "My Books", icon: "🔖" },
  ];

  const adminMenuItems = [
    { path: ROUTES.DASHBOARD, label: "Dashboard", icon: "📊" },
    { path: ROUTES.BOOKS, label: "Browse Books", icon: "📚" },
    { path: ROUTES.ADMIN_USERS, label: "Users", icon: "👥" },
  ];

  const menuItems = user?.role === "admin" ? adminMenuItems : userMenuItems;

  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSettings = () => {
    setMenuOpen(false);
    navigate(ROUTES.PROFILE);
  };

  if (!user) return null;

  return (
    <aside className="w-64 shrink-0 self-start sticky top-0 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700 shrink-0">
        <h1 className="text-xl font-bold">Book Library</h1>
      </div>

      <nav className="p-4 flex-1 overflow-y-auto min-h-0">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive =
              item.path === ROUTES.DASHBOARD
                ? location.pathname === ROUTES.DASHBOARD
                : location.pathname.startsWith(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        ref={menuRef}
        className="relative p-3 border-t border-gray-700 shrink-0"
      >
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-gray-600 bg-gray-900 shadow-xl overflow-hidden">
            <button
              type="button"
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-300 hover:bg-gray-700 transition-colors border-t border-gray-700"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${
            menuOpen ? "bg-gray-700" : "hover:bg-gray-700"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
              menuOpen ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
