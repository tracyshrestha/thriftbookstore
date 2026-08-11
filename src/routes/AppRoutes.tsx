import { Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { isAdminRole } from "@/constants";

// Public pages
import LoginPage from "@/features/auth/pages/Login";
import UnauthorizedPage from "@/features/auth/pages/UnauthorizedPage";

// User pages
import UserHome from "@/features/user/pages/UserDashboard";
import UserProfile from "@/features/user/pages/UserProfile";
import Books from "@/features/user/pages/Books";
import MyBooks from "@/features/user/pages/MyBooks";

// Admin pages
import AdminHome from "@/features/admin/pages/AdminDashboard";
import ManageUsers from "@/features/admin/pages/ManageUsers";
import UserDetail from "@/features/admin/pages/UserDetail";

// Layouts
import DashboardLayout from "@/components/layout/Dashboard/DashboardLayout/DashboardLayout";
import PageSkeleton from "@/components/ui/PageSkeleton";

const DashboardHome = ({ role }: { role?: string }) => {
  if (isAdminRole(role)) return <AdminHome />;
  return <UserHome />;
};

const AppRoutes = () => {
  const { user, isLoading } = useUser();
  const userRole = user?.role;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 p-6">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["user", "admin", "superadmin"]}
            userRole={userRole}
            isLoading={isLoading}
          >
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome role={userRole} />} />
        <Route path="books" element={<Books />} />
        <Route path="my-books" element={<MyBooks />} />
        <Route path="profile" element={<UserProfile />} />
        <Route
          path="users"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "superadmin"]}
              userRole={userRole}
              isLoading={isLoading}
            >
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="user/:id"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "superadmin"]}
              userRole={userRole}
              isLoading={isLoading}
            >
              <UserDetail />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/"
        element={
          userRole === "user" || isAdminRole(userRole) ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
