import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ProtectedRoute } from "./ProtectedRoute";

// Public pages
import LoginPage from "@/features/auth/pages/Login";
import UnauthorizedPage from "@/features/auth/pages/UnauthorizedPage";

// User pages
import UserHome from "@/features/user/pages/UserDashboard";
import UserProfile from "@/features/user/pages/UserProfile";

// Admin pages
import AdminHome from "@/features/admin/pages/AdminDashboard";
import ManageUsers from "@/features/admin/pages/ManageUsers";

// Layouts
import UserDashboardLayout from "@/components/layout/Dashboard/DashboardLayout/DashboardLayout";
import AdminDashboardLayout from "@/components/layout/Dashboard/AdminDashboardLayout/DashboardLayout";

const AppRoutes = () => {
  const { user, isLoading } = useUser();
  const userRole = user?.role;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* User Dashboard */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={["user"]} userRole={userRole} isLoading={isLoading}>
            <UserDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserHome />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>

      {/* Admin Dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]} userRole={userRole} isLoading={isLoading}>
            <AdminDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="users" element={<ManageUsers />} />
      </Route>

      {/* Root redirect based on role */}
      <Route
        path="/"
        element={
          userRole === "admin" ? (
            <Navigate to="/admin" replace />
          ) : userRole === "user" ? (
            <Navigate to="/user" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
