import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout/DashboardLayout";
import Dashboard from "@/features/dashboard/pages/Dashboard";
// import AvailableBooks from "@/features/books/pages/AvailableBooks";
// import MyBooks from "@/features/books/pages/MyBooks";
// import Profile from "@/features/profile/pages/Profile";
import Login from "@/features/auth/pages/Login";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected dashboard routes */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        {/* <Route path="books" element={<AvailableBooks />} />
        <Route path="my-books" element={<MyBooks />} />
        <Route path="profile" element={<Profile />} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
