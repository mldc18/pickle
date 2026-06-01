import { describe, expect, it } from "vitest";

import {
  isBeforeRegistrationDeadline,
  isRegistrationWindowOpen,
} from "./game-deadlines";

describe("game deadlines", () => {
  it("keeps registration closed before noon in Manila", () => {
    expect(
      isRegistrationWindowOpen(new Date("2026-06-01T03:59:00.000Z")),
    ).toBe(false);
    expect(
      isRegistrationWindowOpen(new Date("2026-06-01T04:00:00.000Z")),
    ).toBe(true);
  });

  it("closes registration at 7:30 PM in Manila", () => {
    expect(
      isRegistrationWindowOpen(new Date("2026-06-01T11:29:00.000Z")),
    ).toBe(true);
    expect(
      isRegistrationWindowOpen(new Date("2026-06-01T11:30:00.000Z")),
    ).toBe(false);
  });

  it("treats before-deadline as a close-only check", () => {
    expect(
      isBeforeRegistrationDeadline(new Date("2026-06-01T03:59:00.000Z")),
    ).toBe(true);
  });
});
