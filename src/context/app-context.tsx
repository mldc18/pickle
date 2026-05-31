"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { usePathname } from "next/navigation";
import { User, GameDay, BlockedDate } from "@/lib/schemas";
import { useAuth } from "@/context/auth-context";
import {
  GAME_DAY_COLUMNS,
  GAME_NO_SHOW_COLUMNS,
  GAME_REGISTRATION_COLUMNS,
  MONTHLY_PAYMENT_COLUMNS,
  ROSTER_USER_COLUMNS,
  getAppDataQueryScope,
  getGameDataQueryScope,
  getRosterUserIdsForQuery,
} from "@/lib/app-data-query-scope";
import { createClient } from "@/lib/supabase/client";
import { REGISTRATION_OPEN_HOUR, REGISTRATION_OPEN_MINUTE, REGISTRATION_CLOSE_HOUR, REGISTRATION_CLOSE_MINUTE } from "@/lib/constants";
import { isBeforeCancellationDeadline } from "@/lib/game-deadlines";
import { canTogglePaymentMonth } from "@/lib/admin-payment-permissions";
import {
  DEFAULT_MAX_PLAYERS,
  getCapacitySnapshotUpdatesBeforeDefaultChange,
  normalizeCapacityInput,
  resolveGameCapacity,
  validateCapacityChange,
} from "@/lib/capacity";
import {
  getTodayDate,
  getMonthKey,
  getLast12Months,
} from "@/lib/utils";
import {
  STORAGE_IMAGE_UPLOADS,
  prepareStorageImageUpload,
} from "@/lib/storage-images";

interface AppContextType {
  ready: boolean;
  users: User[];
  gameDay: GameDay;
  gameDays: Record<string, GameDay>;
  defaultCapacity: number;
  blockedDates: BlockedDate[];
  registerForGame: (userId: string, fullName: string) => Promise<"registered" | "waitlisted" | "full" | "blocked" | "unpaid" | "closed">;
  unregisterFromGame: (userId: string) => Promise<void>;
  isRegistered: (userId: string) => boolean;
  isWaitlisted: (userId: string) => boolean;
  getWaitlistPosition: (userId: string) => number;
  getRegistrationStatus: () => "open" | "blocked" | "outside_hours";
  togglePayment: (userId: string, month: string) => Promise<void>;
  blockDate: (date: string, message: string) => Promise<void>;
  unblockDate: (date: string) => Promise<void>;
  updateDefaultCapacity: (capacity: number) => Promise<{ ok: boolean; error?: string }>;
  updateDateCapacity: (date: string, capacity: number) => Promise<{ ok: boolean; error?: string }>;
  clearDateCapacity: (date: string) => Promise<{ ok: boolean; error?: string }>;
  toggleNoShow: (date: string, userId: string) => Promise<void>;
  incrementNoShow: (userId: string) => Promise<void>;
  toggleAdmin: (userId: string) => Promise<void>;
  toggleSuperAdmin: (userId: string) => Promise<void>;
  /** Uploads a new display photo for the current user and returns its public URL. */
  updateOwnPhoto: (file: Blob) => Promise<string | null>;
  /** Updates editable profile fields for the current user. */
  updateProfile: (fields: { email?: string; mobile?: string; emergencyContactName?: string; emergencyContactNumber?: string }) => Promise<{ ok: boolean; error?: string }>;
  /** Uploads or replaces the current user's La Marea ID photo. */
  updateLaMareaId: (file: Blob) => Promise<{ ok: boolean; error?: string }>;
  /** Deletes a user (super admin only). */
  deleteUser: (userId: string) => Promise<{ ok: boolean; error?: string }>;
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
  la_marea_id_url: string | null;
  emergency_contact_name: string;
  emergency_contact_number: string;
  accepted_terms: boolean;
  accepted_rules: boolean;
  must_change_password: boolean | null;
  created_at: string;
};

type PaymentRow = { user_id: string; month: string; paid: boolean };
type NoShowRow = { game_date: string; user_id: string };
type GameDayRow = {
  date: string;
  is_cancelled: boolean;
  cancel_message: string | null;
  capacity_override: number | null;
  capacity_snapshot: number | null;
};
type AppSettingRow = { value: number | string | null };
type RegistrationRow = {
  game_date: string;
  user_id: string;
  status: "registered" | "waitlist";
  position: number;
  registered_at: string;
};
type RosterUserRow = Pick<UserRow, "id" | "full_name" | "avatar_url" | "photo_url">;

// ---------------------------------------------------------------------------

const EMPTY_GAME_DAY: GameDay = {
  date: "",
  isBlocked: false,
  blockMessage: null,
  capacity: DEFAULT_MAX_PLAYERS,
  capacityOverride: null,
  capacitySnapshot: null,
  registeredPlayers: [],
  waitlist: [],
  noShows: [],
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const today = useMemo(() => getTodayDate(), []);
  const pathname = usePathname();
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const currentUserId = currentUser?.id ?? null;

  const [users, setUsers] = useState<User[]>([]);
  const [gameDays, setGameDays] = useState<Record<string, GameDay>>({});
  const [defaultCapacity, setDefaultCapacity] = useState(DEFAULT_MAX_PLAYERS);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [ready, setReady] = useState(false);

  // -------------------------------------------------------------------------
  // Fetchers
  // -------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    if (!currentUserId) {
      setUsers([]);
      setGameDays({});
      setBlockedDates([]);
      return;
    }

    const queryScope = getAppDataQueryScope({
      isAdmin,
      userId: currentUserId,
    });
    const gameDataScope = getGameDataQueryScope({
      isAdmin,
      pathname,
      today,
    });

    let paymentsQuery = supabase
      .from("monthly_payments")
      .select(MONTHLY_PAYMENT_COLUMNS);
    if (queryScope.paymentUserId) {
      paymentsQuery = paymentsQuery.eq("user_id", queryScope.paymentUserId);
    }

    let noShowsQuery = supabase
      .from("game_no_shows")
      .select(GAME_NO_SHOW_COLUMNS);
    if (queryScope.noShowUserId) {
      noShowsQuery = noShowsQuery.eq("user_id", queryScope.noShowUserId);
    }

    const usersQuery = supabase.from("users").select(queryScope.userColumns);
    const scopedUsersQuery = isAdmin ? usersQuery : usersQuery.eq("id", currentUserId);
    let gameDaysQuery = supabase.from("game_days").select(GAME_DAY_COLUMNS);
    let registrationsQuery = supabase
      .from("game_registrations")
      .select(GAME_REGISTRATION_COLUMNS)
      .order("position", { ascending: true });

    if (gameDataScope.gameDate) {
      gameDaysQuery = gameDaysQuery.eq("date", gameDataScope.gameDate);
      registrationsQuery = registrationsQuery.eq("game_date", gameDataScope.gameDate);
    }

    const [usersRes, paymentsRes, noShowsRes, gameDaysRes, regsRes, capacitySettingRes] =
      await Promise.all([
        scopedUsersQuery,
        paymentsQuery,
        noShowsQuery,
        gameDaysQuery,
        registrationsQuery,
        supabase.from("app_settings").select("value").eq("key", "default_game_capacity").maybeSingle(),
      ]);

    const nextDefaultCapacity = normalizeCapacityInput(
      ((capacitySettingRes.data ?? null) as AppSettingRow | null)?.value,
    );
    setDefaultCapacity(nextDefaultCapacity);

    const userRows = (usersRes.data ?? []) as unknown as UserRow[];
    const paymentRows = (paymentsRes.data ?? []) as unknown as PaymentRow[];
    const noShowRows = (noShowsRes.data ?? []) as unknown as NoShowRow[];
    const gameDayRows = (gameDaysRes.data ?? []) as unknown as GameDayRow[];
    const regRows = (regsRes.data ?? []) as unknown as RegistrationRow[];
    const knownUserIds = new Set(userRows.map((u) => u.id));
    const rosterUserIds = getRosterUserIdsForQuery({
      isAdmin,
      today,
      registrations: regRows,
    }).filter((id) => !knownUserIds.has(id));
    let rosterUserRows: RosterUserRow[] = [];

    if (rosterUserIds.length > 0) {
      const { data: rosterUsers, error: rosterUsersError } = await supabase
        .from("users")
        .select(ROSTER_USER_COLUMNS)
        .in("id", rosterUserIds);
      if (rosterUsersError) {
        console.error("roster users fetch failed", rosterUsersError);
      }
      rosterUserRows = (rosterUsers ?? []) as unknown as RosterUserRow[];
    }

    // --- Users (derived: paymentHistory, isPaid, noShowCount) ------------
    const last12 = getLast12Months();
    const currentMonth = getMonthKey(new Date());
    const noShowCounts = new Map<string, number>();
    const noShowDatesByUser = new Map<string, string[]>();
    for (const ns of noShowRows) {
      noShowCounts.set(ns.user_id, (noShowCounts.get(ns.user_id) ?? 0) + 1);
      if (!noShowDatesByUser.has(ns.user_id)) noShowDatesByUser.set(ns.user_id, []);
      noShowDatesByUser.get(ns.user_id)!.push(ns.game_date);
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
        laMareaIdUrl: u.la_marea_id_url ?? null,
        emergencyContactName: u.emergency_contact_name ?? "",
        emergencyContactNumber: u.emergency_contact_number ?? "",
        acceptedRules: u.accepted_rules ?? false,
        mustChangePassword: u.must_change_password ?? false,
        isPaid: userPayments.get(currentMonth) ?? false,
        paymentHistory,
        noShowCount: noShowCounts.get(u.id) ?? 0,
        noShowDates: (noShowDatesByUser.get(u.id) ?? []).sort().reverse(),
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
      [...userRows, ...rosterUserRows].map((u) => [
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
      const capacityOverride = gd?.capacity_override ?? null;
      const capacitySnapshot = gd?.capacity_snapshot ?? null;
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
        capacity: resolveGameCapacity({
          defaultCapacity: nextDefaultCapacity,
          dateCapacityOverride: capacityOverride,
          capacitySnapshot,
        }),
        capacityOverride,
        capacitySnapshot,
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
  }, [supabase, today, currentUserId, isAdmin, pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      await fetchAll();
      if (!cancelled) {
        setReady(true);
      }
    }

    void loadInitialState();

    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const gameDay = gameDays[today] ?? {
    ...EMPTY_GAME_DAY,
    date: today,
    capacity: defaultCapacity,
  };

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const getRegistrationStatus = useCallback((): "open" | "blocked" | "outside_hours" => {
    if (gameDay.isBlocked || blockedDates.some((b) => b.date === today)) {
      return "blocked";
    }
    const now = new Date();
    const openMinutes = REGISTRATION_OPEN_HOUR * 60 + REGISTRATION_OPEN_MINUTE;
    const closeMinutes = REGISTRATION_CLOSE_HOUR * 60 + REGISTRATION_CLOSE_MINUTE;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (nowMinutes < openMinutes || nowMinutes >= closeMinutes) {
      return "outside_hours";
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
      if (status === "outside_hours") return "closed" as const;

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
      if (!isBeforeCancellationDeadline()) {
        return;
      }

      const { error } = await supabase.rpc("unregister_from_game", { p_date: today });
      if (error) console.error("unregister_from_game failed", error);
      await fetchAll();
    },
    [supabase, today, fetchAll],
  );

  const togglePayment = useCallback(
    async (userId: string, month: string) => {
      if (!canTogglePaymentMonth(month, getMonthKey(new Date()), isSuperAdmin)) {
        return;
      }

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
    [supabase, fetchAll, isSuperAdmin],
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

  const updateDefaultCapacity = useCallback(
    async (capacity: number): Promise<{ ok: boolean; error?: string }> => {
      const nextCapacity = normalizeCapacityInput(capacity);
      const overloadedDay = Object.values(gameDays).find(
        (candidate) =>
          candidate.date >= today &&
          candidate.capacityOverride === null &&
          candidate.registeredPlayers.length > nextCapacity,
      );

      if (overloadedDay) {
        return validateCapacityChange(nextCapacity, overloadedDay.registeredPlayers.length);
      }

      const snapshotUpdates = getCapacitySnapshotUpdatesBeforeDefaultChange(
        Object.values(gameDays).map((candidate) => ({
          date: candidate.date,
          capacity: candidate.capacity,
          capacityOverride: candidate.capacityOverride,
          capacitySnapshot: candidate.capacitySnapshot,
          registeredPlayersCount: candidate.registeredPlayers.length,
        })),
      );

      if (snapshotUpdates.length > 0) {
        const { error: snapshotError } = await supabase
          .from("game_days")
          .upsert(
            snapshotUpdates.map((update) => {
              const existing = gameDays[update.date];
              return {
                date: update.date,
                is_cancelled: existing?.isBlocked ?? false,
                cancel_message: existing?.blockMessage ?? null,
                capacity_snapshot: update.capacitySnapshot,
              };
            }),
            { onConflict: "date" },
          );
        if (snapshotError) return { ok: false, error: snapshotError.message };
      }

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "default_game_capacity",
          value: nextCapacity,
          updated_at: new Date().toISOString(),
        });
      if (error) return { ok: false, error: error.message };

      const { error: rebalanceError } = await supabase.rpc("rebalance_game_registrations", {
        p_date: today,
      });
      if (rebalanceError) console.error("rebalance_game_registrations failed", rebalanceError);

      await fetchAll();
      return { ok: true };
    },
    [supabase, gameDays, today, fetchAll],
  );

  const updateDateCapacity = useCallback(
    async (date: string, capacity: number): Promise<{ ok: boolean; error?: string }> => {
      const nextCapacity = normalizeCapacityInput(capacity);
      const existing = gameDays[date];
      const validation = validateCapacityChange(
        nextCapacity,
        existing?.registeredPlayers.length ?? 0,
      );
      if (!validation.ok) return validation;

      const { error } = await supabase
        .from("game_days")
        .upsert({
          date,
          is_cancelled: existing?.isBlocked ?? false,
          cancel_message: existing?.blockMessage ?? null,
          capacity_override: nextCapacity,
        });
      if (error) return { ok: false, error: error.message };

      const { error: rebalanceError } = await supabase.rpc("rebalance_game_registrations", {
        p_date: date,
      });
      if (rebalanceError) console.error("rebalance_game_registrations failed", rebalanceError);

      await fetchAll();
      return { ok: true };
    },
    [supabase, gameDays, fetchAll],
  );

  const clearDateCapacity = useCallback(
    async (date: string): Promise<{ ok: boolean; error?: string }> => {
      const existing = gameDays[date];
      const validation = validateCapacityChange(
        defaultCapacity,
        existing?.registeredPlayers.length ?? 0,
      );
      if (!validation.ok) return validation;

      const { error } = await supabase
        .from("game_days")
        .upsert({
          date,
          is_cancelled: existing?.isBlocked ?? false,
          cancel_message: existing?.blockMessage ?? null,
          capacity_override: null,
        });
      if (error) return { ok: false, error: error.message };

      const { error: rebalanceError } = await supabase.rpc("rebalance_game_registrations", {
        p_date: date,
      });
      if (rebalanceError) console.error("rebalance_game_registrations failed", rebalanceError);

      await fetchAll();
      return { ok: true };
    },
    [supabase, gameDays, defaultCapacity, fetchAll],
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
      let upload: Awaited<ReturnType<typeof prepareStorageImageUpload>>;
      try {
        upload = await prepareStorageImageUpload(file, STORAGE_IMAGE_UPLOADS.profile);
      } catch (conversionError) {
        console.error("updateOwnPhoto conversion failed", conversionError);
        return null;
      }
      const path = `${uid}/display-${Date.now()}.${upload.extension}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, upload.blob, {
          contentType: upload.contentType,
          cacheControl: upload.cacheControl,
          upsert: false,
        });
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

  const updateProfile = useCallback(
    async (fields: { email?: string; mobile?: string; emergencyContactName?: string; emergencyContactNumber?: string }): Promise<{ ok: boolean; error?: string }> => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) return { ok: false, error: "Not authenticated" };

      const row: Record<string, string> = {};
      if (fields.email !== undefined) row.email = fields.email;
      if (fields.mobile !== undefined) row.mobile = fields.mobile;
      if (fields.emergencyContactName !== undefined) row.emergency_contact_name = fields.emergencyContactName;
      if (fields.emergencyContactNumber !== undefined) row.emergency_contact_number = fields.emergencyContactNumber;

      if (Object.keys(row).length === 0) return { ok: true };

      const { error } = await supabase.from("users").update(row).eq("id", uid);
      if (error) return { ok: false, error: error.message };

      await fetchAll();
      return { ok: true };
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

  const updateLaMareaId = useCallback(
    async (file: Blob): Promise<{ ok: boolean; error?: string }> => {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (!uid) return { ok: false, error: "Not authenticated" };

      let upload: Awaited<ReturnType<typeof prepareStorageImageUpload>>;
      try {
        upload = await prepareStorageImageUpload(file, STORAGE_IMAGE_UPLOADS.document);
      } catch (conversionError) {
        return {
          ok: false,
          error: conversionError instanceof Error
            ? conversionError.message
            : "Image conversion failed. Please try another image.",
        };
      }
      const path = `${uid}/la-marea-id.${upload.extension}`;
      const { error: uploadError } = await supabase.storage
        .from("la-marea-ids")
        .upload(path, upload.blob, {
          contentType: upload.contentType,
          cacheControl: upload.cacheControl,
          upsert: true,
        });
      if (uploadError) return { ok: false, error: uploadError.message };

      const { data: urlData } = supabase.storage.from("la-marea-ids").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("users")
        .update({ la_marea_id_url: urlData.publicUrl })
        .eq("id", uid);
      if (updateError) return { ok: false, error: updateError.message };

      await fetchAll();
      return { ok: true };
    },
    [supabase, fetchAll],
  );

  const deleteUser = useCallback(
    async (userId: string): Promise<{ ok: boolean; error?: string }> => {
      const { error } = await supabase.rpc("delete_user", { target_user_id: userId });
      if (error) return { ok: false, error: error.message };
      await fetchAll();
      return { ok: true };
    },
    [supabase, fetchAll],
  );

  return (
    <AppContext.Provider
      value={{
        ready,
        users,
        gameDay,
        gameDays,
        defaultCapacity,
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
        updateDefaultCapacity,
        updateDateCapacity,
        clearDateCapacity,
        toggleNoShow,
        incrementNoShow,
        toggleAdmin,
        toggleSuperAdmin,
        updateOwnPhoto,
        updateProfile,
        updateLaMareaId,
        deleteUser,
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
