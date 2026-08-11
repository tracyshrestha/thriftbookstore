import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ROUTES, isAdminRole } from "@/constants";
import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  ChevronUp,
  Home,
  LayoutPanelLeft,
  LogOut,
  PanelLeftClose,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import brandLogo from "@/assets/book.png";
import { RechargeCreditsModal } from "./RechargeCreditsModal";

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

function formatCredits(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, credits, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const mainMenu: NavItem[] = isAdminRole(user?.role)
    ? [
        { path: ROUTES.DASHBOARD, label: "Dashboard", icon: Home },
        { path: ROUTES.BOOKS, label: "Browse Books", icon: BookOpen },
        { path: ROUTES.ADMIN_USERS, label: "Users", icon: Users },
      ]
    : [
        { path: ROUTES.DASHBOARD, label: "Dashboard", icon: Home },
        { path: ROUTES.BOOKS, label: "Browse Books", icon: BookOpen },
        { path: ROUTES.MY_BOOKS, label: "My Books", icon: BookMarked },
      ];

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

  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD) {
      return location.pathname === ROUTES.DASHBOARD;
    }
    if (path === ROUTES.ADMIN_USERS) {
      return (
        location.pathname === ROUTES.ADMIN_USERS ||
        location.pathname.startsWith("/dashboard/user/")
      );
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate(ROUTES.LOGIN);
  };

  const handleSettings = () => {
    setMenuOpen(false);
    navigate(ROUTES.PROFILE);
  };

  const openRecharge = () => {
    setMenuOpen(false);
    setRechargeOpen(true);
  };

  if (!user) return null;

  return (
    <aside
      className={`shrink-0 self-start sticky top-0 h-screen flex flex-col border-r border-ink-100 transition-[width] duration-200 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
      style={{
        background: "var(--sidebar-gradient)",
      }}
    >
      {/* Header */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 shrink-0 pt-5 pb-3 px-3">
          <img
            src={brandLogo}
            alt="Thrift Bookstore"
            className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white border border-ink-100 shadow-sm p-0.5"
          />
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100/70 hover:text-ink-800 transition-colors"
          >
            <LayoutPanelLeft className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center shrink-0 py-5 px-4 justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={brandLogo}
              alt="Thrift Bookstore"
              className="h-9 w-9 shrink-0 rounded-xl object-contain bg-white border border-ink-100 shadow-sm p-0.5"
            />
            <span className="text-[15px] font-semibold text-ink-950 truncate tracking-tight">
              Thrift
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100/70 hover:text-ink-800 transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto min-h-0 px-3 pb-3">
        {!collapsed && (
          <p className="px-2 mb-2 text-[11px] font-medium text-ink-400/90 tracking-wide">
            Main Menu
          </p>
        )}
        <ul className="space-y-0.5">
          {mainMenu.map((item) => (
            <NavLinkItem
              key={`main-${item.path}-${item.label}`}
              item={item}
              active={isActive(item.path)}
              collapsed={collapsed}
            />
          ))}
        </ul>

        {/* Credits — below menu (e.g. under My Books), not a card */}
        <div className={collapsed ? "mt-3" : "mt-4 pt-3 border-t border-ink-100/80"}>
          {!collapsed && (
            <p className="px-2 mb-1.5 text-[11px] font-medium text-ink-400/90 tracking-wide">
              Credits
            </p>
          )}
          <button
            type="button"
            onClick={openRecharge}
            title="Add credits"
            aria-label={`Credits ${formatCredits(credits)}. Add credits.`}
            className={`w-full flex items-center rounded-xl text-[13.5px] transition-colors text-ink-900/75 hover:bg-ink-50 ${
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-2.5 py-2"
            }`}
          >
            <Wallet
              className="h-[18px] w-[18px] shrink-0 stroke-[1.5] text-ink-800/80"
            />
            {!collapsed && (
              <span className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                <span className="truncate">Balance</span>
                <span className="font-semibold text-ink-950 tabular-nums shrink-0">
                  {formatCredits(credits)}
                </span>
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Profile footer */}
      <div ref={menuRef} className="relative shrink-0 p-3">
        {menuOpen && (
          <div
            className={`absolute bottom-full mb-2 rounded-xl border border-ink-100 bg-white shadow-lg overflow-hidden ${
              collapsed ? "left-2 right-2" : "left-3 right-3"
            }`}
          >
            <button
              type="button"
              onClick={openRecharge}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-ink-900 hover:bg-ink-50 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              {!collapsed && "Add credits"}
            </button>
            <button
              type="button"
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-ink-900 hover:bg-ink-50 transition-colors border-t border-ink-50"
            >
              <Settings className="w-4 h-4" />
              {!collapsed && "Account settings"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-600 hover:bg-ink-50 transition-colors border-t border-ink-50"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && "Logout"}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={`w-full flex items-center gap-2.5 rounded-xl transition-colors text-left ${
            collapsed ? "p-1.5 justify-center" : "p-2"
          } ${menuOpen ? "bg-ink-100" : "hover:bg-ink-50"}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-600 text-[11px] font-semibold text-white">
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-950 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-ink-400 truncate">{user.email}</p>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-ink-300 shrink-0 transition-transform ${
                  menuOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            </>
          )}
        </button>
      </div>

      <RechargeCreditsModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
      />
    </aside>
  );
};

function NavLinkItem({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        to={item.path}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 rounded-xl text-[13.5px] transition-colors ${
          collapsed ? "justify-center px-2 py-2.5" : "px-2.5 py-2"
        } ${
          active
            ? "bg-ink-100 text-ink-900 font-medium"
            : "text-ink-900/75 hover:bg-ink-50"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 stroke-[1.5] ${
            active ? "text-ink-700" : "text-ink-800/80"
          }`}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    </li>
  );
}

export default Sidebar;
