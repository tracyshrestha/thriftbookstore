import React from "react";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const UserProfile: React.FC = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <p className="text-gray-500">Loading profile...</p>;
  }

  if (!user) {
    return <p className="text-gray-500">No profile data available.</p>;
  }

  const fields = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "User ID", value: user.id },
    { label: "Role", value: user.role },
  ];

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile</h2>
      <p className="text-gray-500 mb-6">Your account information</p>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl font-semibold">
            {user.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl text-gray-900 truncate">
              {user.name}
            </CardTitle>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
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
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-100">
            {fields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-gray-500">
                  {field.label}
                </dt>
                <dd
                  className={`text-sm text-gray-900 text-right ${
                    field.label === "Role" ? "capitalize" : ""
                  }`}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
