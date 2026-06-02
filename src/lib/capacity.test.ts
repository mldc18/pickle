import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_PLAYERS,
  MAX_CAPACITY_LIMIT,
  getCapacitySnapshotUpdatesBeforeDefaultChange,
  normalizeCapacityInput,
  resolveGameCapacity,
  validateCapacityChange,
} from "./capacity";

describe("capacity rules", () => {
  it("uses a date override before falling back to the current default for current and future dates", () => {
    expect(
      resolveGameCapacity({
        defaultCapacity: 30,
        dateCapacityOverride: 36,
        capacitySnapshot: 24,
        gameDate: "2026-06-02",
        today: "2026-06-02",
      }),
    ).toBe(36);
    expect(
      resolveGameCapacity({
        defaultCapacity: 30,
        dateCapacityOverride: null,
        capacitySnapshot: 24,
        gameDate: "2026-06-02",
        today: "2026-06-02",
      }),
    ).toBe(30);
    expect(
      resolveGameCapacity({
        defaultCapacity: 30,
        dateCapacityOverride: null,
        capacitySnapshot: 24,
        gameDate: "2026-06-03",
        today: "2026-06-02",
      }),
    ).toBe(30);
  });

  it("uses capacity snapshots only for past dates", () => {
    expect(
      resolveGameCapacity({
        defaultCapacity: 30,
        dateCapacityOverride: null,
        capacitySnapshot: 24,
        gameDate: "2026-06-01",
        today: "2026-06-02",
      }),
    ).toBe(24);
    expect(
      resolveGameCapacity({
        defaultCapacity: 30,
        dateCapacityOverride: null,
        capacitySnapshot: null,
      }),
    ).toBe(30);
    expect(
      resolveGameCapacity({
        defaultCapacity: null,
        dateCapacityOverride: null,
        capacitySnapshot: null,
      }),
    ).toBe(DEFAULT_MAX_PLAYERS);
  });

  it("normalizes admin capacity input into a bounded whole number", () => {
    expect(normalizeCapacityInput("36")).toBe(36);
    expect(normalizeCapacityInput("30.8")).toBe(30);
    expect(normalizeCapacityInput("0")).toBe(DEFAULT_MAX_PLAYERS);
    expect(normalizeCapacityInput(String(MAX_CAPACITY_LIMIT + 100))).toBe(MAX_CAPACITY_LIMIT);
  });

  it("rejects a capacity lower than the number of already confirmed players", () => {
    expect(validateCapacityChange(30, 24)).toEqual({ ok: true });
    expect(validateCapacityChange(20, 24)).toEqual({
      ok: false,
      error: "Capacity cannot be lower than the 24 players already confirmed.",
    });
  });

  it("finds past default-driven game days that need a capacity snapshot before the default changes", () => {
    expect(
      getCapacitySnapshotUpdatesBeforeDefaultChange(
        [
          {
            date: "2026-05-29",
            capacity: 24,
            capacityOverride: null,
            capacitySnapshot: null,
            registeredPlayersCount: 21,
          },
          {
            date: "2026-05-30",
            capacity: 30,
            capacityOverride: 30,
            capacitySnapshot: null,
            registeredPlayersCount: 24,
          },
          {
            date: "2026-05-31",
            capacity: 24,
            capacityOverride: null,
            capacitySnapshot: 24,
            registeredPlayersCount: 20,
          },
          {
            date: "2026-06-01",
            capacity: 24,
            capacityOverride: null,
            capacitySnapshot: null,
            registeredPlayersCount: 0,
          },
          {
            date: "2026-06-02",
            capacity: 28,
            capacityOverride: null,
            capacitySnapshot: null,
            registeredPlayersCount: 18,
          },
          {
            date: "2026-06-03",
            capacity: 28,
            capacityOverride: null,
            capacitySnapshot: null,
            registeredPlayersCount: 2,
          },
        ],
        "2026-06-02",
      ),
    ).toEqual([{ date: "2026-05-29", capacitySnapshot: 24 }]);
  });
});
