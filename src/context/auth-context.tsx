"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { User, AuthState, RegistrationFormData } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegistrationFormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) {
        setUser(null);
        return;
      }
      setUser({
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        mobile: data.mobile,
        address: data.address,
        role: data.role,
        avatarUrl: data.avatar_url,
        // isPaid / paymentHistory / noShowCount are derived — populated later
        // once app-context is wired to Supabase. For now, defaults.
        isPaid: false,
        paymentHistory: [],
        noShowCount: 0,
        acceptedTerms: data.accepted_terms,
        createdAt: new Date(data.created_at).toISOString().split("T")[0],
      });
    },
    [supabase],
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        loadProfile(data.user.id).finally(() => setMounted(true));
      } else {
        setMounted(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) return false;
      await loadProfile(data.user.id);
      return true;
    },
    [supabase, loadProfile],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const register = useCallback(
    async (data: RegistrationFormData) => {
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || nameParts[0];

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
            first_name: firstName,
            last_name: lastName,
            mobile: data.mobile,
            address: data.address,
            role: "member",
            accepted_terms: data.acceptedTerms,
          },
        },
      });
      if (error) return { ok: false as const, error: error.message };
      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        return { ok: false as const, error: "Account created but no user id returned" };
      }

      // Upload profile photo to storage and update avatar_url on the profile row.
      const path = `${newUserId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, data.profilePhoto, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        return { ok: false as const, error: `Photo upload failed: ${uploadError.message}` };
      }
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", newUserId);
      if (updateError) {
        return { ok: false as const, error: `Profile update failed: ${updateError.message}` };
      }

      await loadProfile(newUserId);
      return { ok: true as const };
    },
    [supabase, loadProfile],
  );

  if (!mounted) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin" || user?.role === "super_admin",
        isSuperAdmin: user?.role === "super_admin",
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
