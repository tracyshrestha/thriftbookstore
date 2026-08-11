import React, { useEffect, useState } from "react";
import { fetchJson } from "@/lib/jsonFetcher";
import { API_ENDPOINTS } from "@/constants";
import type { User } from "@/features/auth/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        const data = await fetchJson<User[]>(API_ENDPOINTS.USERS);
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

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <p className="text-gray-500 mt-1">
          Manage library members and administrators
        </p>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-gray-700">
            All users
            {!isLoading && !error && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({users.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-gray-500 py-6 text-center">
              Loading users...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {!isLoading && !error && users.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">
              No users found.
            </p>
          )}

          {!isLoading && !error && users.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-xs text-gray-400 font-mono">
                      {user.id}
                    </span>
                    <Badge
                      variant="secondary"
                      className={
                        user.role === "admin"
                          ? "bg-violet-100 text-violet-800 capitalize"
                          : "bg-blue-100 text-blue-800 capitalize"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
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
