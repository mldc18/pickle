import { describe, expect, it } from "vitest";

import {
  RECENT_NO_SHOW_COLUMN,
  buildAdminUsersCsvRows,
  countNoShowsInLastMonths,
} from "./admin-users-export";
import type { User } from "./schemas";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    username: "bea",
    fullName: "Bea Zulu",
    firstName: "Bea",
    lastName: "Zulu",
    email: "bea@example.com",
    mobile: "09171234567",
    address: "123 Court St",
    role: "member",
    avatarUrl: "https://example.com/avatar.webp",
    photoUrl: null,
    paymentScreenshotUrl: null,
    laMareaIdUrl: null,
    emergencyContactName: "Alex Zulu",
    emergencyContactNumber: "09170000000",
    acceptedRules: true,
    isPaid: true,
    paymentHistory: [],
    noShowCount: 0,
    noShowDates: [],
    acceptedTerms: true,
    createdAt: "2026-04-01",
    ...overrides,
  };
}

describe("admin users export", () => {
  it("counts no-shows in the rolling last 2 months", () => {
    const referenceDate = new Date(2026, 4, 25);

    expect(
      countNoShowsInLastMonths(
        [
          "2026-03-24",
          "2026-03-25",
          "2026-04-10",
          "2026-05-25",
          "2026-05-26",
        ],
        referenceDate,
      ),
    ).toBe(3);
  });

  it("adds the recent no-show count to exported user rows", () => {
    const referenceDate = new Date(2026, 4, 25);
    const { headers, rows } = buildAdminUsersCsvRows(
      [
        makeUser({
          noShowDates: ["2026-04-01", "2026-01-15"],
        }),
      ],
      referenceDate,
    );

    expect(headers).toContain(RECENT_NO_SHOW_COLUMN);
    expect(rows[0][headers.indexOf(RECENT_NO_SHOW_COLUMN)]).toBe(1);
  });

  it("does not export La Marea ID URLs", () => {
    const { headers, rows } = buildAdminUsersCsvRows([
      makeUser({
        laMareaIdUrl: "https://example.com/la-marea-id.webp",
      }),
    ]);

    expect(headers).not.toContain("La Marea ID URL");
    expect(rows[0]).not.toContain("https://example.com/la-marea-id.webp");
    expect(rows[0]).toHaveLength(headers.length);
  });

  it("exports users alphabetically by first name", () => {
    const { rows } = buildAdminUsersCsvRows([
      makeUser({
        id: "user-kenneth",
        fullName: "Kenneth Abalena",
        firstName: "Kenneth",
        lastName: "Abalena",
      }),
      makeUser({
        id: "user-beatriz",
        fullName: "Beatriz Gloria",
        firstName: "Beatriz",
        lastName: "Gloria",
      }),
      makeUser({
        id: "user-coleen",
        fullName: "Coleen Antioqui",
        firstName: "Coleen",
        lastName: "Antioqui",
      }),
    ]);

    expect(rows.map((row) => row[0])).toEqual([
      "Beatriz Gloria",
      "Coleen Antioqui",
      "Kenneth Abalena",
    ]);
  });
});
