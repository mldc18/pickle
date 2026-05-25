import { describe, expect, it } from "vitest";

import { canTogglePaymentMonth } from "./admin-payment-permissions";

describe("admin payment permissions", () => {
  it("allows super admins to toggle a future payment month", () => {
    expect(canTogglePaymentMonth("2026-06", "2026-05", true)).toBe(true);
  });

  it("keeps future payment months locked for regular admins", () => {
    expect(canTogglePaymentMonth("2026-06", "2026-05", false)).toBe(false);
  });

  it("keeps current and past months toggleable for admins", () => {
    expect(canTogglePaymentMonth("2026-05", "2026-05", false)).toBe(true);
    expect(canTogglePaymentMonth("2026-04", "2026-05", false)).toBe(true);
  });
});
