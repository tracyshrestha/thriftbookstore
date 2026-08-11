import React, { createContext, useContext, useState, useEffect } from "react";
import { loginRequest, rechargeCreditsRequest } from "@/api/auth.api";
import { STORAGE_KEYS } from "@/constants";
import type { User } from "@/features/auth/types/user";
import {
  DEFAULT_CREDITS_CENTS,
  addUserCredits,
  getUserCredits,
  hasStoredCredits,
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
  /** Recharge thrift credits (cents). Returns new balance or null on failure. */
  rechargeCredits: (amountCents: number) => Promise<number | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function withCredits(user: User): User {
  const seed = user.credits ?? DEFAULT_CREDITS_CENTS;
  const credits = hasStoredCredits(user.id)
    ? getUserCredits(user.id, seed)
    : setUserCredits(user.id, seed);
  return { ...user, credits };
}

function persistUser(next: User) {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(next));
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
        persistUser(hydrated);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginRequest({ email, password });
    if (result.success && result.user) {
      const hydrated = withCredits(result.user);
      persistUser(hydrated);
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
    persistUser(updated);
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
    persistUser(updated);
    setUser(updated);
    return next;
  };

  const rechargeCredits = async (amountCents: number) => {
    if (!user) return null;
    const add = Math.round(amountCents);
    if (!Number.isFinite(add) || add <= 0) return null;

    const next = addUserCredits(
      user.id,
      add,
      user.credits ?? DEFAULT_CREDITS_CENTS,
    );

    try {
      await rechargeCreditsRequest({
        userId: user.id,
        amountCents: add,
        balanceAfter: next,
      });
    } catch {
      // Still apply client-side for offline mock UX; balance already stored
    }

    const updated = { ...user, credits: next };
    persistUser(updated);
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
        rechargeCredits,
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
