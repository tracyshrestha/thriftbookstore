// API Endpoints
export const API_ENDPOINTS = {
  USERS: "/data/users.json",
  BOOKS: "/data/books.json",
  CHECKOUTS: "/data/checkout.json",
} as const;

// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_USER: "auth:user",
} as const;

// Route Paths
export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PERSONAL_INFO: "/personal-info",
  CHECKED_OUT: "/checked-out",
  BOOKS: "/books",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_BOOKS: "/admin/books",
  ADMIN_REPORTS: "/admin/reports",
} as const;

// Demo Credentials
export const DEMO_CREDENTIALS = {
  REGULAR_USERS: [
    { email: "jane@example.com", name: "Jane Doe" },
    { email: "john@example.com", name: "John Smith" },
  ],
  ADMIN_USER: {
    email: "admin@admin.com",
    name: "Admin User",
  },
} as const;
