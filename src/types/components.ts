import { ReactNode } from "react";

// Layout Components
export interface AppLayoutProps {
  children: ReactNode;
}

export interface SidebarProps {
  className?: string;
}

export interface FooterProps {
  className?: string;
}

// Page Components
export interface DashboardPageProps {
  className?: string;
}

export interface AdminDashboardProps {
  className?: string;
}

export interface LoginPageProps {
  className?: string;
}

export interface PersonalInfoPageProps {
  className?: string;
}

export interface CheckedOutPageProps {
  className?: string;
}

export interface BooksPageProps {
  className?: string;
}

export interface UserManagementPageProps {
  className?: string;
}

export interface BookManagementPageProps {
  className?: string;
}

export interface ReportsPageProps {
  className?: string;
}

// Router Components
export interface DashboardRouterProps {
  className?: string;
}
