import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "@/api/users.api";
import type { User } from "@/features/auth/types/user";
import { ROUTES } from "@/constants";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getUserCredits } from "@/lib/credits";
import {
  ChevronRight,
  Search,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

function formatCredits(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatJoined(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleBadgeClass(role: string) {
  if (role === "superadmin") return "bg-ink-800 text-white";
  if (role === "admin") return "bg-ink-100 text-ink-800";
  return "bg-ink-50 text-ink-700 ring-1 ring-ink-100";
}

function RoleIcon({ role }: { role: string }) {
  if (role === "superadmin") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (role === "admin") return <Shield className="h-3.5 w-3.5" />;
  return <UserRound className="h-3.5 w-3.5" />;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getUsers();
        if (!cancelled) setUsers(data);
      } catch {
        if (!cancelled) setError("Failed to load users. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  const stats = useMemo(() => {
    const members = users.filter((u) => u.role === "user").length;
    const admins = users.filter(
      (u) => u.role === "admin" || u.role === "superadmin",
    ).length;
    return { total: users.length, members, admins };
  }, [users]);

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink-950">Users</h2>
          <p className="text-sm text-ink-500 mt-1">
            Manage library members and administrators
          </p>
        </div>
        <label className="relative flex h-10 w-full sm:w-72 items-center rounded-lg border border-ink-100 bg-white shadow-sm focus-within:border-ink-300 focus-within:ring-2 focus-within:ring-ink-100">
          <Search className="absolute left-3 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, role…"
            className="h-full w-full rounded-lg bg-transparent pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatPill
          icon={Users}
          label="Total"
          value={stats.total}
        />
        <StatPill
          icon={UserRound}
          label="Members"
          value={stats.members}
        />
        <StatPill
          icon={Shield}
          label="Admins"
          value={stats.admins}
        />
      </div>

      <div className="rounded-xl border border-ink-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
          <div>
            <p className="text-sm font-semibold text-ink-950">All users</p>
            <p className="text-xs text-ink-400 mt-0.5">
              {filtered.length === users.length
                ? `${users.length} account${users.length === 1 ? "" : "s"}`
                : `Showing ${filtered.length} of ${users.length}`}
            </p>
          </div>
        </div>

        {error && (
          <p className="m-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {!error && filtered.length === 0 && (
          <p className="text-sm text-ink-500 py-14 text-center">
            {query.trim()
              ? "No users match your search."
              : "No users found."}
          </p>
        )}

        {!error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-ink-400 bg-ink-50/60 border-b border-ink-100">
                  <th className="font-medium px-5 py-3">User</th>
                  <th className="font-medium px-4 py-3">Email</th>
                  <th className="font-medium px-4 py-3">Role</th>
                  <th className="font-medium px-4 py-3">Credits</th>
                  <th className="font-medium px-4 py-3">Joined</th>
                  <th className="font-medium px-4 py-3 text-right">ID</th>
                  <th className="font-medium px-5 py-3 w-12">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const credits = getUserCredits(
                    user.id,
                    user.credits ?? 0,
                  );
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={ROUTES.ADMIN_USER(user.id)}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700 text-xs font-semibold ring-1 ring-ink-100">
                            {getInitials(user.name)}
                          </span>
                          <span className="font-medium text-ink-950 truncate group-hover:text-ink-800">
                            {user.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-ink-600 max-w-[200px]">
                        <span className="truncate block">{user.email}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleBadgeClass(user.role)}`}
                        >
                          <RoleIcon role={user.role} />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-ink-900 tabular-nums">
                        {formatCredits(credits)}
                      </td>
                      <td className="px-4 py-3.5 text-ink-500 tabular-nums whitespace-nowrap">
                        {formatJoined(user.joinedAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <code className="text-[11px] text-ink-400 bg-ink-50 px-1.5 py-0.5 rounded font-mono">
                          {user.id}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={ROUTES.ADMIN_USER(user.id)}
                          aria-label={`View ${user.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-300 group-hover:text-ink-600 group-hover:bg-ink-100 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-sm flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-700">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-lg font-semibold text-ink-950 tabular-nums leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

export default ManageUsers;
