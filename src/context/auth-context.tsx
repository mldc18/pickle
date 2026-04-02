"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, AuthState, RegistrationFormData } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data";
import { generateId, getLast12Months } from "@/lib/utils";

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  register: (data: RegistrationFormData) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "lampa-auth-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setMounted(true);
  }, []);

  const login = useCallback(
    (username: string, password: string): boolean => {
      const found = users.find(
        (u) => u.username === username && u.password === password
      );
      if (found) {
        setUser(found);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        return true;
      }
      return false;
    },
    [users]
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const register = useCallback(
    (data: RegistrationFormData): boolean => {
      if (users.some((u) => u.username === data.username)) {
        return false;
      }
      const nameParts = data.fullName.trim().split(/\s+/);
      const newUser: User = {
        id: generateId(),
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || nameParts[0],
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        laMareaIdUrl: "/placeholder-id.jpg",
        registrationFeeUrl: "/placeholder-receipt.jpg",
        role: "member",
        isPaid: false,
        paymentHistory: getLast12Months().map((month) => ({ month, paid: false })),
        noShowCount: 0,
        acceptedTerms: data.acceptedTerms,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      return true;
    },
    [users]
  );

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
