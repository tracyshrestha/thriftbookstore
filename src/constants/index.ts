// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_USER: "auth:user",
} as const;

// Route Paths
export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  BOOKS: "/dashboard/books",
  MY_BOOKS: "/dashboard/my-books",
  PROFILE: "/dashboard/profile",
  ADMIN_USERS: "/dashboard/users",
  ADMIN_BOOKS: "/dashboard/books",
  ADMIN_REPORTS: "/dashboard/reports",
} as const;

/** Roles that use admin UI / elevated access */
export const ADMIN_ROLES = ["admin", "superadmin"] as const;

export function isAdminRole(role?: string | null) {
  return role === "admin" || role === "superadmin";
}
