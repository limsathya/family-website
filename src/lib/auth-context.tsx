"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  id: number;
  name: string;
  name_zh: string | null;
  name_km: string | null;
  email: string;
  role?: string;
}

interface ProfileUpdate {
  name: string;
  name_zh?: string | null;
  name_km?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (name: string, email: string, password: string, redeemCode?: string, nameZh?: string, nameKm?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
  updateProfile: async () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      setUser(data.user);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, redeemCode?: string, nameZh?: string, nameKm?: string) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, redeemCode, nameZh, nameKm }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Signup failed" };

      // Auto login after signup
      const loginResult = await login(email, password);
      return loginResult;
    } catch {
      return { error: "Network error" };
    }
  }, [login]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error || "Failed to update profile" };
      setUser(json);
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
