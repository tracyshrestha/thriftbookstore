/** Paths under /mock-api — one JSON file per endpoint */

export const API_PATHS = {
  AUTH_CREDENTIALS: "auth/credentials.json",
  USERS_LIST: "users/list.json",
  BOOKS: "books/list.json",
  CHECKOUTS_LIST: "checkouts/list.json",
  DASHBOARD_OVERVIEW: "dashboard/overview.json",
  CART_LIST: "cart/list.json",
} as const;
