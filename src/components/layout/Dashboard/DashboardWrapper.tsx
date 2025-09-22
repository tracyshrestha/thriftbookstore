import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import AdminDashboard from './AdminDashboardLayout/DashboardLayout';
import UserDashboard from './DashboardLayout/DashboardLayout';

const DashboardWrapper: React.FC = () => {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default DashboardWrapper;
