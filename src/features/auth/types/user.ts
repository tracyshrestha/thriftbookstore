export type UserRole = "user" | "admin" | "superadmin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  joinedAt?: string;
};
