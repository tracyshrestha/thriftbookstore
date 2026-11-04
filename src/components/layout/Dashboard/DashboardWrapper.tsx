import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import AdminDashboard from "./AdminDashboardLayout/DashboardLayout";
import UserDashboard from "./DashboardLayout/DashboardLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";

const DashboardWrapper: React.FC = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 p-6">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  return user.role === "admin" ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardWrapper;
