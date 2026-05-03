export const DEFAULT_MAX_PLAYERS = 24;
export const MAX_CAPACITY_LIMIT = 72;

export function normalizeCapacityInput(value: string | number | null | undefined): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_MAX_PLAYERS;
  }

  return Math.min(Math.floor(parsed), MAX_CAPACITY_LIMIT);
}

export function resolveGameCapacity({
  defaultCapacity,
  dateCapacityOverride,
}: {
  defaultCapacity: number | null | undefined;
  dateCapacityOverride: number | null | undefined;
}) {
  return normalizeCapacityInput(dateCapacityOverride ?? defaultCapacity ?? DEFAULT_MAX_PLAYERS);
}

export function validateCapacityChange(capacity: number, confirmedPlayers: number) {
  if (capacity < confirmedPlayers) {
    return {
      ok: false as const,
      error: `Capacity cannot be lower than the ${confirmedPlayers} players already confirmed.`,
    };
  }

  return { ok: true as const };
}
