"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type User = {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
};

type AuthContextType = {
  user: User | null;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Client-side fallback list (if API doesn't return role)
const ADMIN_EMAILS = ['fk123456@gmail.com'];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to read user from cache:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = async (email: string, password: string, name?: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || email.split("@")[0] }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    // Auto-login after signup
    await login(email, password);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Determine role: prefer API, fallback to client list
    const role: 'admin' | 'user' = data.user?.role || (ADMIN_EMAILS.includes(email) ? 'admin' : 'user');

    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name || email.split("@")[0],
      role,
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const mergedUser = { ...currentUser, ...updates };
      localStorage.setItem("user", JSON.stringify(mergedUser));
      return mergedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};