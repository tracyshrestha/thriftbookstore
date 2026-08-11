import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import PageSkeleton from "@/components/ui/PageSkeleton";

interface ProtectedRouteProps {
  allowedRoles: string[];
  userRole?: string;
  isLoading?: boolean;
  children: ReactNode;
}

export const ProtectedRoute = ({
  allowedRoles,
  userRole,
  isLoading,
  children,
}: ProtectedRouteProps) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 p-6">
        <PageSkeleton />
      </div>
    );
  }

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
