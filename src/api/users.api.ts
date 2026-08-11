import { apiRequest } from "./client";
import { API_PATHS } from "./paths";
import type { User } from "@/features/auth/types/user";
import { getSavedBookIds } from "@/lib/savedBooks";

export type UpdateProfilePayload = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

/** Mock wishlist maps: userId → book ids */
export type UserSavedMap = Record<string, string[]>;

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
 * Wishlist book ids for a member:
 * - local saves for that user (from Browse heart)
 * - plus mock /users/saved.json so admin view has demo data
 */
export async function getUserSavedBookIds(userId: string): Promise<string[]> {
  let mockIds: string[] = [];
  try {
    const map = await apiRequest<UserSavedMap>(API_PATHS.USERS_SAVED);
    mockIds = Array.isArray(map[userId]) ? map[userId] : [];
  } catch {
    mockIds = [];
  }

  const localIds = getSavedBookIds(userId);
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...localIds, ...mockIds]) {
    if (typeof id === "string" && !seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  return merged;
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
