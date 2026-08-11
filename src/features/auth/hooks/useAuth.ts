import { useEffect, useState } from "react";
import { loginRequest } from "@/api/auth.api";
import type { AuthState } from "../types/auth.types";
import type { User } from "../types/user";
import { STORAGE_KEYS } from "@/constants";

export function useAuth(): AuthState & { isLoading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    const result = await loginRequest({ email, password });
    if (result.success && result.user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(result.user));
      setUser(result.user);
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
