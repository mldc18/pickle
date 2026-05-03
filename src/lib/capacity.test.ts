import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAX_PLAYERS,
  MAX_CAPACITY_LIMIT,
  normalizeCapacityInput,
  resolveGameCapacity,
  validateCapacityChange,
} from "./capacity";

describe("capacity rules", () => {
  it("uses a date override before falling back to the current default", () => {
    expect(resolveGameCapacity({ defaultCapacity: 30, dateCapacityOverride: 36 })).toBe(36);
    expect(resolveGameCapacity({ defaultCapacity: 30, dateCapacityOverride: null })).toBe(30);
    expect(resolveGameCapacity({ defaultCapacity: null, dateCapacityOverride: null })).toBe(
      DEFAULT_MAX_PLAYERS,
    );
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
});
