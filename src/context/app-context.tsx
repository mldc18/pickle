"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { User, GameDay, BlockedDate, RegisteredPlayer } from "@/lib/types";
import { mockUsers, mockGameDay, mockGameDays, mockBlockedDates } from "@/lib/mock-data";
import { MAX_SLOTS, REGISTRATION_OPEN_HOUR, REGISTRATION_CLOSE_HOUR } from "@/lib/constants";
import { getCurrentTime, getTodayDate, getMonthKey } from "@/lib/utils";

interface AppContextType {
  users: User[];
  gameDay: GameDay;
  gameDays: Record<string, GameDay>;
  blockedDates: BlockedDate[];
  registerForGame: (userId: string, fullName: string) => "registered" | "waitlisted" | "full" | "blocked" | "unpaid" | "closed";
  unregisterFromGame: (userId: string) => void;
  isRegistered: (userId: string) => boolean;
  isWaitlisted: (userId: string) => boolean;
  getWaitlistPosition: (userId: string) => number;
  getRegistrationStatus: () => "not_open" | "open" | "closed" | "blocked";
  togglePayment: (userId: string, month: string) => void;
  blockDate: (date: string, message: string) => void;
  unblockDate: (date: string) => void;
  toggleNoShow: (date: string, userId: string) => void;
  getGameDay: (date: string) => GameDay | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [gameDays, setGameDays] = useState<Record<string, GameDay>>(mockGameDays);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>(mockBlockedDates);

  const today = getTodayDate();
  const gameDay = gameDays[today] || mockGameDay;

  const setGameDay = useCallback((updater: (prev: GameDay) => GameDay) => {
    setGameDays((prev) => ({
      ...prev,
      [today]: updater(prev[today] || mockGameDay),
    }));
  }, [today]);

  const getRegistrationStatus = useCallback((): "not_open" | "open" | "closed" | "blocked" => {
    if (gameDay.isBlocked || blockedDates.some((b) => b.date === today)) {
      return "blocked";
    }
    const now = getCurrentTime();
    const hour = now.getHours();
    if (hour < REGISTRATION_OPEN_HOUR) return "not_open";
    if (hour >= REGISTRATION_CLOSE_HOUR) return "closed";
    return "open";
  }, [gameDay.isBlocked, blockedDates, today]);

  const isRegistered = useCallback(
    (userId: string) => gameDay.registeredPlayers.some((p) => p.userId === userId),
    [gameDay.registeredPlayers]
  );

  const isWaitlisted = useCallback(
    (userId: string) => gameDay.waitlist.some((p) => p.userId === userId),
    [gameDay.waitlist]
  );

  const getWaitlistPosition = useCallback(
    (userId: string) => {
      const idx = gameDay.waitlist.findIndex((p) => p.userId === userId);
      return idx === -1 ? -1 : idx + 1;
    },
    [gameDay.waitlist]
  );

  const registerForGame = useCallback(
    (userId: string, fullName: string) => {
      const status = getRegistrationStatus();
      if (status === "blocked") return "blocked" as const;
      if (status !== "open") return "closed" as const;

      const user = users.find((u) => u.id === userId);
      if (user && !user.isPaid) return "unpaid" as const;

      const player: RegisteredPlayer = {
        userId,
        fullName,
        registeredAt: new Date().toISOString(),
      };

      setGameDay((prev) => {
        if (prev.registeredPlayers.some((p) => p.userId === userId)) return prev;
        if (prev.waitlist.some((p) => p.userId === userId)) return prev;

        if (prev.registeredPlayers.length < MAX_SLOTS) {
          return { ...prev, registeredPlayers: [...prev.registeredPlayers, player] };
        }
        return { ...prev, waitlist: [...prev.waitlist, player] };
      });

      return gameDay.registeredPlayers.length < MAX_SLOTS ? "registered" as const : "waitlisted" as const;
    },
    [getRegistrationStatus, users, gameDay.registeredPlayers.length, setGameDay]
  );

  const unregisterFromGame = useCallback((userId: string) => {
    setGameDay((prev) => {
      const wasRegistered = prev.registeredPlayers.some((p) => p.userId === userId);
      const newRegistered = prev.registeredPlayers.filter((p) => p.userId !== userId);
      const newWaitlist = [...prev.waitlist.filter((p) => p.userId !== userId)];

      if (wasRegistered && newWaitlist.length > 0 && newRegistered.length < MAX_SLOTS) {
        const promoted = newWaitlist.shift()!;
        newRegistered.push(promoted);
      }

      return { ...prev, registeredPlayers: newRegistered, waitlist: newWaitlist };
    });
  }, [setGameDay]);

  const togglePayment = useCallback((userId: string, month: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const newHistory = u.paymentHistory.map((p) =>
          p.month === month ? { ...p, paid: !p.paid } : p
        );
        const currentMonth = getMonthKey(new Date());
        const currentPaid = newHistory.find((p) => p.month === currentMonth)?.paid ?? false;
        return { ...u, paymentHistory: newHistory, isPaid: currentPaid };
      })
    );
  }, []);

  const blockDate = useCallback((date: string, message: string) => {
    setBlockedDates((prev) => {
      if (prev.some((b) => b.date === date)) return prev;
      return [...prev, { date, message }];
    });
    if (date === today) {
      setGameDay((prev) => ({ ...prev, isBlocked: true, blockMessage: message }));
    }
  }, [today, setGameDay]);

  const unblockDate = useCallback((date: string) => {
    setBlockedDates((prev) => prev.filter((b) => b.date !== date));
    if (date === today) {
      setGameDay((prev) => ({ ...prev, isBlocked: false, blockMessage: null }));
    }
  }, [today, setGameDay]);

  const toggleNoShow = useCallback((date: string, userId: string) => {
    setGameDays((prev) => {
      const gd = prev[date];
      if (!gd) return prev;
      const noShows = gd.noShows.includes(userId)
        ? gd.noShows.filter((id) => id !== userId)
        : [...gd.noShows, userId];
      return { ...prev, [date]: { ...gd, noShows } };
    });
    // Also update user's noShowCount
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const gd = gameDays[date];
        if (!gd) return u;
        const wasNoShow = gd.noShows.includes(userId);
        return { ...u, noShowCount: wasNoShow ? Math.max(0, u.noShowCount - 1) : u.noShowCount + 1 };
      })
    );
  }, [gameDays]);

  const getGameDay = useCallback((date: string): GameDay | undefined => {
    return gameDays[date];
  }, [gameDays]);

  return (
    <AppContext.Provider
      value={{
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
