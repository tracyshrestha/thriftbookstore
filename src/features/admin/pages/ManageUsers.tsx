import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "@/api/users.api";
import type { User } from "@/features/auth/types/user";
import { ROUTES } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { ChevronRight } from "lucide-react";

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink-950">Users</h2>
        <p className="text-ink-500 mt-1">
          Manage library members and administrators
        </p>
      </div>

      <Card className="w-full border border-ink-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-ink-700">
            All users
            {!error && (
              <span className="ml-2 text-sm font-normal text-ink-400">
                ({users.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {!error && users.length === 0 && (
            <p className="text-sm text-ink-500 py-6 text-center">
              No users found.
            </p>
          )}

          {!error && users.length > 0 && (
            <ul className="divide-y divide-ink-50 w-full">
              {users.map((user) => (
                <li key={user.id} className="w-full">
                  <Link
                    to={ROUTES.ADMIN_USER(user.id)}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 w-full rounded-lg hover:bg-ink-50/70 -mx-2 px-2 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700 text-sm font-semibold">
                      {getInitials(user.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-950 truncate group-hover:text-ink-800">
                        {user.name}
                      </p>
                      <p className="text-sm text-ink-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline text-xs text-ink-400 font-mono">
                        {user.id}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-ink-100 text-ink-800 capitalize"
                      >
                        {user.role}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-ink-500" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageUsers;
