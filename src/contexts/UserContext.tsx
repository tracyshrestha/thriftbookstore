import React, { createContext, useContext, useState, useEffect } from "react";
import { loginRequest } from "@/api/auth.api";
import { STORAGE_KEYS } from "@/constants";
import type { User } from "@/features/auth/types/user";
import {
  DEFAULT_CREDITS_CENTS,
  getUserCredits,
  setUserCredits,
} from "@/lib/credits";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  credits: number;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  /** Returns remaining credits, or null if insufficient / not logged in */
  spendCredits: (amountCents: number) => number | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function withCredits(user: User): User {
  const credits = getUserCredits(
    user.id,
    user.credits ?? DEFAULT_CREDITS_CENTS,
  );
  return { ...user, credits };
}

function seedCreditsForUser(userId: string): number {
  const existingMap = (() => {
    try {
      const raw = localStorage.getItem("thrift_user_credits");
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, number>;
    } catch {
      return null;
    }
  })();

  if (existingMap && typeof existingMap[userId] === "number") {
    return existingMap[userId];
  }

  const seed =
    userId === "u1" ? 25000 : userId === "u2" ? 8000 : DEFAULT_CREDITS_CENTS;
  return setUserCredits(userId, seed);
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as User;
        const hydrated = withCredits(parsed);
        setUser(hydrated);
        localStorage.setItem(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(hydrated),
        );
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    if (result.success && result.user) {
      const credits = seedCreditsForUser(result.user.id);
      const hydrated = { ...result.user, credits };
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(hydrated));
      setUser(hydrated);
      return hydrated;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    if (typeof data.credits === "number") {
      setUserCredits(user.id, data.credits);
      updated.credits = getUserCredits(user.id);
    }
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    setUser(updated);
  };

  const spendCredits = (amountCents: number) => {
    if (!user) return null;
    const current = getUserCredits(
      user.id,
      user.credits ?? DEFAULT_CREDITS_CENTS,
    );
    if (amountCents > current) return null;
    const next = setUserCredits(user.id, current - amountCents);
    const updated = { ...user, credits: next };
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    setUser(updated);
    return next;
  };

  const credits = user
    ? (user.credits ?? getUserCredits(user.id))
    : 0;

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        credits,
        login,
        logout,
        updateUser,
        spendCredits,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
