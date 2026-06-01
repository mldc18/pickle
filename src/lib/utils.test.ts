import { describe, expect, it } from "vitest";

import { getTodayDate } from "./utils";

describe("date utilities", () => {
  it("uses the Manila calendar date for today", () => {
    expect(getTodayDate(new Date("2026-06-02T16:30:00.000Z"))).toBe("2026-06-03");
  });
});
