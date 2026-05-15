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
import { AUTH_USER_COLUMNS } from "@/lib/app-data-query-scope";
import { createClient } from "@/lib/supabase/client";
import {
  STORAGE_IMAGE_UPLOADS,
  prepareStorageImageUpload,
} from "@/lib/storage-images";

interface AuthContextType extends AuthState {
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegistrationFormData) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  address: string;
  role: "member" | "admin" | "super_admin";
  avatar_url: string;
  photo_url: string | null;
  payment_screenshot_url?: string | null;
  la_marea_id_url?: string | null;
  emergency_contact_name: string | null;
  emergency_contact_number: string | null;
  accepted_terms: boolean;
  accepted_rules: boolean;
  created_at: string;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("users")
        .select(AUTH_USER_COLUMNS)
        .eq("id", userId)
        .single();
      if (error || !data) {
        setUser(null);
        return;
      }
      const profile = data as unknown as ProfileRow;
      setUser({
        id: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        mobile: profile.mobile,
        address: profile.address,
        role: profile.role,
        avatarUrl: profile.avatar_url,
        photoUrl: profile.photo_url ?? null,
        paymentScreenshotUrl: profile.payment_screenshot_url ?? null,
        laMareaIdUrl: profile.la_marea_id_url ?? null,
        emergencyContactName: profile.emergency_contact_name ?? "",
        emergencyContactNumber: profile.emergency_contact_number ?? "",
        acceptedRules: profile.accepted_rules ?? false,
        // isPaid / paymentHistory / noShowCount are derived — populated later
        // once app-context is wired to Supabase. For now, defaults.
        isPaid: false,
        paymentHistory: [],
        noShowCount: 0,
        noShowDates: [],
        acceptedTerms: profile.accepted_terms,
        createdAt: new Date(profile.created_at).toISOString().split("T")[0],
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
    async (usernameOrEmail: string, password: string): Promise<boolean> => {
      const trimmed = usernameOrEmail.trim();
      // If the input already looks like an email (has @), sign in directly.
      // Otherwise treat it as a username and resolve to the account's email
      // via a lookup against public.users. users.email is readable under
      // users_select_authenticated — for the anonymous login case we call a
      // security-definer RPC instead.
      let email = trimmed;
      if (!trimmed.includes("@")) {
        const { data: lookup, error: lookupError } = await supabase.rpc(
          "email_for_username",
          { p_username: trimmed },
        );
        if (lookupError || !lookup) return false;
        email = lookup as string;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
            emergency_contact_name: data.emergencyContactName,
            emergency_contact_number: data.emergencyContactNumber,
            role: "member",
            accepted_terms: data.acceptedTerms,
            accepted_rules: data.acceptedRules,
          },
        },
      });
      if (error) return { ok: false as const, error: error.message };
      const newUserId = signUpData.user?.id;
      if (!newUserId) {
        return { ok: false as const, error: "Account created but no user id returned" };
      }

      // Upload profile photo to storage and update avatar_url on the profile row.
      const avatarUpload = await prepareStorageImageUpload(
        data.profilePhoto,
        STORAGE_IMAGE_UPLOADS.profile,
      );
      const path = `${newUserId}/avatar.${avatarUpload.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarUpload.blob, {
          contentType: avatarUpload.contentType,
          cacheControl: avatarUpload.cacheControl,
          upsert: true,
        });
      if (uploadError) {
        return { ok: false as const, error: `Photo upload failed: ${uploadError.message}` };
      }
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: avatarUrl,
          emergency_contact_name: data.emergencyContactName,
          emergency_contact_number: data.emergencyContactNumber,
        })
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
