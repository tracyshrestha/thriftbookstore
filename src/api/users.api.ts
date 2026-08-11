import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import type { User } from "@/features/auth/types/user";

export type UpdateProfilePayload = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

/** GET /mock-api/users/list.json */
export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>(API_PATHS.USERS_LIST);
}

/** GET user by id — simulated via list filter */
export async function getUserById(id: string): Promise<User | null> {
  const users = await apiRequest<User[]>(API_PATHS.USERS_LIST, {
    method: "GET",
  });
  return users.find((u) => u.id === id) ?? null;
}

/**
 * Simulated POST update profile.
 * Network tab shows users/list.json?_method=POST&payload=...
 */
export async function updateUserProfile(
  current: User,
  payload: UpdateProfilePayload,
): Promise<User> {
  await apiRequest<User[]>(API_PATHS.USERS_LIST, {
    method: "POST",
    body: {
      action: "updateProfile",
      ...payload,
    },
  });

  return {
    ...current,
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || undefined,
  };
}
