import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/jsonFetcher";
import type { AuthState } from "../types/auth.types";
import type { User } from "../types/user";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";

export function useAuth(): AuthState & { isLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      setUser(JSON.parse(raw));
    }
    setIsLoading(false); // finished loading
  }, []);

  async function login(email: string, _password: string): Promise<boolean> {
    const users = await fetchJson<User[]>(API_ENDPOINTS.USERS);
    const found =
      users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    if (found) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(found));
      setUser(found);
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setUser(null);
  }

  function updateUser(userData: Partial<User>) {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }

  return { user, login, logout, updateUser, isLoading };
}
