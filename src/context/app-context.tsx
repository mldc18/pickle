"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { User, GameDay, BlockedDate } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { MAX_SLOTS } from "@/lib/constants";
import {
  getTodayDate,
  getMonthKey,
  getLast12Months,
} from "@/lib/utils";

interface AppContextType {
  ready: boolean;
  users: User[];
  gameDay: GameDay;
  gameDays: Record<string, GameDay>;
  blockedDates: BlockedDate[];
  registerForGame: (userId: string, fullName: string) => Promise<"registered" | "waitlisted" | "full" | "blocked" | "unpaid" | "closed">;
  unregisterFromGame: (userId: string) => Promise<void>;
  isRegistered: (userId: string) => boolean;
  isWaitlisted: (userId: string) => boolean;
  getWaitlistPosition: (userId: string) => number;
  getRegistrationStatus: () => "open" | "blocked";
  togglePayment: (userId: string, month: string) => Promise<void>;
  blockDate: (date: string, message: string) => Promise<void>;
  unblockDate: (date: string) => Promise<void>;
  toggleNoShow: (date: string, userId: string) => Promise<void>;
  incrementNoShow: (userId: string) => Promise<void>;
  toggleAdmin: (userId: string) => Promise<void>;
  toggleSuperAdmin: (userId: string) => Promise<void>;
  /** Uploads a new display photo for the current user and returns its public URL. */
  updateOwnPhoto: (file: Blob) => Promise<string | null>;
  getGameDay: (date: string) => GameDay | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

// ---------------------------------------------------------------------------
// DB row types (snake_case, match Supabase)
// ---------------------------------------------------------------------------

type UserRow = {
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
  payment_screenshot_url: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  accepted_terms: boolean;
  accepted_rules: boolean;
  created_at: string;
};

type PaymentRow = { user_id: string; month: string; paid: boolean };
type NoShowRow = { game_date: string; user_id: string };
type GameDayRow = { date: string; is_cancelled: boolean; cancel_message: string | null };
type RegistrationRow = {
  game_date: string;
  user_id: string;
  status: "registered" | "waitlist";
  position: number;
  registered_at: string;
};

// ---------------------------------------------------------------------------

const EMPTY_GAME_DAY: GameDay = {
  date: "",
  isBlocked: false,
  blockMessage: null,
  registeredPlayers: [],
  waitlist: [],
  noShows: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const today = useMemo(() => getTodayDate(), []);

  const [users, setUsers] = useState<User[]>([]);
  const [gameDays, setGameDays] = useState<Record<string, GameDay>>({});
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [ready, setReady] = useState(false);

  // -------------------------------------------------------------------------
  // Fetchers
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    const [usersRes, paymentsRes, noShowsRes, gameDaysRes, regsRes] =
      await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("monthly_payments").select("*"),
        supabase.from("game_no_shows").select("*"),
        supabase.from("game_days").select("*"),
        supabase.from("game_registrations").select("*").order("position", { ascending: true }),
      ]);

    const userRows = (usersRes.data ?? []) as UserRow[];
    const paymentRows = (paymentsRes.data ?? []) as PaymentRow[];
    const noShowRows = (noShowsRes.data ?? []) as NoShowRow[];
    const gameDayRows = (gameDaysRes.data ?? []) as GameDayRow[];
    const regRows = (regsRes.data ?? []) as RegistrationRow[];

    // --- Users (derived: paymentHistory, isPaid, noShowCount) ------------
    const last12 = getLast12Months();
    const currentMonth = getMonthKey(new Date());
    const noShowCounts = new Map<string, number>();
    for (const ns of noShowRows) {
      noShowCounts.set(ns.user_id, (noShowCounts.get(ns.user_id) ?? 0) + 1);
    }
    const paymentsByUser = new Map<string, Map<string, boolean>>();
    for (const p of paymentRows) {
      const monthKey = p.month.slice(0, 7); // YYYY-MM-DD → YYYY-MM
      if (!paymentsByUser.has(p.user_id)) paymentsByUser.set(p.user_id, new Map());
      paymentsByUser.get(p.user_id)!.set(monthKey, p.paid);
    }
    const enrichedUsers: User[] = userRows.map((u) => {
      const userPayments = paymentsByUser.get(u.id) ?? new Map();
      const paymentHistory = last12.map((month) => ({
        month,
        paid: userPayments.get(month) ?? false,
      }));
      return {
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        mobile: u.mobile,
        address: u.address,
        role: u.role,
        avatarUrl: u.avatar_url,
        photoUrl: u.photo_url,
        paymentScreenshotUrl: u.payment_screenshot_url ?? null,
        emergencyContactName: u.emergency_contact_name ?? "",
        emergencyContactNumber: u.emergency_contact_number ?? "",
        acceptedRules: u.accepted_rules ?? false,
        isPaid: userPayments.get(currentMonth) ?? false,
        paymentHistory,
        noShowCount: noShowCounts.get(u.id) ?? 0,
        acceptedTerms: u.accepted_terms,
        createdAt: new Date(u.created_at).toISOString().split("T")[0],
      };
    });
    setUsers(enrichedUsers);

    // --- Game days -------------------------------------------------------
    // For the player list we prefer the user-editable display photo
    // (photo_url) and fall back to the immutable registration selfie
    // (avatar_url) when the user hasn't uploaded one yet.
    const userInfoById = new Map(
      userRows.map((u) => [
        u.id,
        { fullName: u.full_name, avatarUrl: u.photo_url ?? u.avatar_url },
      ]),
    );
    const regsByDate = new Map<string, RegistrationRow[]>();
    for (const r of regRows) {
      if (!regsByDate.has(r.game_date)) regsByDate.set(r.game_date, []);
      regsByDate.get(r.game_date)!.push(r);
    }
    const noShowsByDate = new Map<string, string[]>();
    for (const ns of noShowRows) {
      if (!noShowsByDate.has(ns.game_date)) noShowsByDate.set(ns.game_date, []);
      noShowsByDate.get(ns.game_date)!.push(ns.user_id);
    }

    const gameDayMap: Record<string, GameDay> = {};
    const allDates = new Set<string>([
      ...gameDayRows.map((g) => g.date),
      ...regsByDate.keys(),
      ...noShowsByDate.keys(),
      today,
    ]);

    for (const date of allDates) {
      const gd = gameDayRows.find((g) => g.date === date);
      const regs = regsByDate.get(date) ?? [];
      const registered = regs
        .filter((r) => r.status === "registered")
        .sort((a, b) => a.position - b.position)
        .map((r) => {
          const info = userInfoById.get(r.user_id);
          return {
            userId: r.user_id,
            fullName: info?.fullName ?? "Unknown",
            avatarUrl: info?.avatarUrl ?? "",
            registeredAt: r.registered_at,
          };
        });
      const waitlist = regs
        .filter((r) => r.status === "waitlist")
        .sort((a, b) => a.position - b.position)
        .map((r) => {
          const info = userInfoById.get(r.user_id);
          return {
            userId: r.user_id,
            fullName: info?.fullName ?? "Unknown",
            avatarUrl: info?.avatarUrl ?? "",
            registeredAt: r.registered_at,
          };
        });
      gameDayMap[date] = {
        date,
        isBlocked: gd?.is_cancelled ?? false,
        blockMessage: gd?.cancel_message ?? null,
        registeredPlayers: registered,
        waitlist,
        noShows: noShowsByDate.get(date) ?? [],
      };
    }
    setGameDays(gameDayMap);

    // --- Blocked dates ---------------------------------------------------
    setBlockedDates(
      gameDayRows
        .filter((g) => g.is_cancelled && g.cancel_message)
        .map((g) => ({ date: g.date, message: g.cancel_message! })),
    );
  }, [supabase, today]);

  useEffect(() => {
    fetchAll().finally(() => setReady(true));
  }, [fetchAll]);

  const gameDay = gameDays[today] ?? { ...EMPTY_GAME_DAY, date: today };

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const getRegistrationStatus = useCallback((): "open" | "blocked" => {
    // Registration is open all day on the game day. The 7:30–10:00 PM
    // window is only the game schedule, not a registration window —
    // players can sign up at any hour as long as the date isn't blocked.
    if (gameDay.isBlocked || blockedDates.some((b) => b.date === today)) {
      return "blocked";
    }
    return "open";
  }, [gameDay.isBlocked, blockedDates, today]);

  const isRegistered = useCallback(
    (userId: string) => gameDay.registeredPlayers.some((p) => p.userId === userId),
    [gameDay.registeredPlayers],
  );
  const isWaitlisted = useCallback(
    (userId: string) => gameDay.waitlist.some((p) => p.userId === userId),
    [gameDay.waitlist],
  );
  const getWaitlistPosition = useCallback(
    (userId: string) => {
      const idx = gameDay.waitlist.findIndex((p) => p.userId === userId);
      return idx === -1 ? -1 : idx + 1;
    },
    [gameDay.waitlist],
  );
  const getGameDay = useCallback(
    (date: string): GameDay | undefined => gameDays[date],
    [gameDays],
  );

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const registerForGame = useCallback(
    async (_userId: string, _fullName: string) => {
      const status = getRegistrationStatus();
      if (status === "blocked") return "blocked" as const;

      const { data, error } = await supabase.rpc("register_for_game", { p_date: today });
      if (error) {
        console.error("register_for_game failed", error);
        return "closed" as const;
      }
      await fetchAll();
      if (data === "registered") return "registered" as const;
      if (data === "waitlist") return "waitlisted" as const;
      if (data === "blocked") return "blocked" as const;
      if (data === "unpaid") return "unpaid" as const;
      return "closed" as const;
    },
    [supabase, today, fetchAll, getRegistrationStatus],
  );

  const unregisterFromGame = useCallback(
    async (_userId: string) => {
      const { error } = await supabase.rpc("unregister_from_game", { p_date: today });
      if (error) console.error("unregister_from_game failed", error);
      await fetchAll();
    },
    [supabase, today, fetchAll],
  );

  const togglePayment = useCallback(
    async (userId: string, month: string) => {
      // month is "YYYY-MM"; convert to date "YYYY-MM-01"
      const monthDate = `${month}-01`;
      const { data: existing } = await supabase
        .from("monthly_payments")
        .select("paid")
        .eq("user_id", userId)
        .eq("month", monthDate)
        .maybeSingle();

      const nextPaid = !(existing?.paid ?? false);
      const { error } = await supabase
        .from("monthly_payments")
        .upsert({ user_id: userId, month: monthDate, paid: nextPaid });
      if (error) console.error("togglePayment failed", error);
      await fetchAll();
    },
    [supabase, fetchAll],
  );

  const blockDate = useCallback(
    async (date: string, message: string) => {
      const { error } = await supabase
        .from("game_days")
        .upsert({ date, is_cancelled: true, cancel_message: message });
      if (error) console.error("blockDate failed", error);
      await fetchAll();
    },
    [supabase, fetchAll],
  );

  const unblockDate = useCallback(
    async (date: string) => {
      const { error } = await supabase
        .from("game_days")
        .upsert({ date, is_cancelled: false, cancel_message: null });
      if (error) console.error("unblockDate failed", error);
      await fetchAll();
    },
    [supabase, fetchAll],
  );

  const toggleNoShow = useCallback(
    async (date: string, userId: string) => {
      const { data: existing } = await supabase
        .from("game_no_shows")
        .select("user_id")
        .eq("game_date", date)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase.from("game_no_shows").delete().eq("game_date", date).eq("user_id", userId);
      } else {
        // ensure game_day row exists
        await supabase.from("game_days").upsert({ date, is_cancelled: false }, { onConflict: "date", ignoreDuplicates: true });
        await supabase.from("game_no_shows").insert({ game_date: date, user_id: userId });
      }
      await fetchAll();
    },
    [supabase, fetchAll],
  );

  const incrementNoShow = useCallback(
    async (userId: string) => {
      // Admin-only convenience: record a no-show against today's game day.
      await toggleNoShow(today, userId);
    },
    [toggleNoShow, today],
  );

  const toggleAdmin = useCallback(
    async (userId: string) => {
      const current = users.find((u) => u.id === userId);
      if (!current) return;
      // Super-admin transitions are handled by toggleSuperAdmin.
      if (current.role === "super_admin") return;
      const nextRole = current.role === "admin" ? "member" : "admin";
      const { error } = await supabase
        .from("users")
        .update({ role: nextRole })
        .eq("id", userId);
      if (error) console.error("toggleAdmin failed", error);
      await fetchAll();
    },
    [supabase, users, fetchAll],
  );

  const updateOwnPhoto = useCallback(
    async (file: Blob): Promise<string | null> => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) return null;

      // Path layout: photos/{uid}/display-{timestamp}.{ext}
      // New filename per upload so we don't need to bust a CDN cache,
      // and the old object stays until the user (or a sweeper) removes it.
      const mime = file.type || "image/jpeg";
      const ext =
        mime === "image/png" ? "png"
          : mime === "image/webp" ? "webp"
          : mime === "image/heic" || mime === "image/heif" ? "heic"
          : "jpg";
      const path = `${uid}/display-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, { contentType: mime, upsert: false });
      if (uploadError) {
        console.error("updateOwnPhoto upload failed", uploadError);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("photos")
        .getPublicUrl(path);
      const publicUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ photo_url: publicUrl })
        .eq("id", uid);
      if (updateError) {
        console.error("updateOwnPhoto row update failed", updateError);
        return null;
      }

      await fetchAll();
      return publicUrl;
    },
    [supabase, fetchAll],
  );

  const toggleSuperAdmin = useCallback(
    async (userId: string) => {
      const current = users.find((u) => u.id === userId);
      if (!current) return;
      // Promote any non-super_admin straight to super_admin; demote an
      // existing super_admin back to regular admin (never to member, so
      // access isn't silently stripped without an explicit second step).
      const nextRole = current.role === "super_admin" ? "admin" : "super_admin";
      const { error } = await supabase
        .from("users")
        .update({ role: nextRole })
        .eq("id", userId);
      if (error) console.error("toggleSuperAdmin failed", error);
      await fetchAll();
    },
    [supabase, users, fetchAll],
  );

  // MAX_SLOTS is referenced in type signatures via the schema; also re-export
  // here as a silent no-op so the import isn't tree-shaken as unused.
  void MAX_SLOTS;

  return (
    <AppContext.Provider
      value={{
        ready,
        users,
        gameDay,
        gameDays,
        blockedDates,
        registerForGame,
        unregisterFromGame,
        isRegistered,
        isWaitlisted,
        getWaitlistPosition,
        getRegistrationStatus,
        togglePayment,
        blockDate,
        unblockDate,
        toggleNoShow,
        incrementNoShow,
        toggleAdmin,
        toggleSuperAdmin,
        updateOwnPhoto,
        getGameDay,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
