import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchJson } from "@/lib/jsonFetcher";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/constants";
import type { User } from "@/features/auth/types/user";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<User | null>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (raw) setUser(JSON.parse(raw));
    setIsLoading(false);
  }, []);

  // Login returns the user immediately
  const login = async (email: string) => {
    const users = await fetchJson<User[]>(API_ENDPOINTS.USERS);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    if (found) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(found));
      setUser(found);
      return found; // return user for immediate use
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
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
