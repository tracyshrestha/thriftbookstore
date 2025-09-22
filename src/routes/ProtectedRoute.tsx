
import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

interface ProtectedRouteProps {
  allowedRoles: string[]
  userRole?: string
  isLoading?: boolean
  children: ReactNode // ✅ This should render the layout components
}

export const ProtectedRoute = ({
  allowedRoles,
  userRole,
  isLoading,
  children, // Now properly using children instead of just Outlet
}: ProtectedRouteProps) => {
  // Still loading user → show spinner or nothing
  if (isLoading) {
    return <div>Loading...</div> // or your fancy loader
  }

  // No user role (not logged in) → go to login
  if (!userRole) {
    return <Navigate to="/login" replace />
  }

  // Role not allowed → go to unauthorized
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  // ✅ Allowed → render children (the layout components)
  return <>{children}</>
}
