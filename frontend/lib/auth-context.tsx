"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { api } from "./api";

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  preferred_language: string;
  accessibility_mode: string;
  subscription_plan: string;
  subscription_expires_at?: string | null;
  created_at: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { full_name: string; email: string; password: string; phone?: string; preferred_language: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = Cookies.get("km_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const persistTokens = (access: string, refresh: string) => {
    Cookies.set("km_access_token", access, { expires: 1, sameSite: "lax" });
    Cookies.set("km_refresh_token", refresh, { expires: 30, sameSite: "lax" });
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    persistTokens(res.data.access_token, res.data.refresh_token);
    setUser(res.data.user);
  };

  const register = async (data: { full_name: string; email: string; password: string; phone?: string; preferred_language: string }) => {
    const res = await api.post("/auth/register", data);
    persistTokens(res.data.access_token, res.data.refresh_token);
    setUser(res.data.user);
  };

  const logout = () => {
    Cookies.remove("km_access_token");
    Cookies.remove("km_refresh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
