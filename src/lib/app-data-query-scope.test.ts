import { describe, expect, it } from "vitest";

import {
  ADMIN_USER_COLUMNS,
  AUTH_USER_COLUMNS,
  MEMBER_USER_COLUMNS,
  ROSTER_USER_COLUMNS,
  getAppDataQueryScope,
  getGameDataQueryScope,
  getRosterUserIdsForQuery,
} from "./app-data-query-scope";

describe("app data query scope", () => {
  it("keeps auth profile reads explicit", () => {
    expect(AUTH_USER_COLUMNS).toContain("id");
    expect(AUTH_USER_COLUMNS).toContain("must_change_password");
    expect(AUTH_USER_COLUMNS).not.toContain("payment_screenshot_url");
    expect(AUTH_USER_COLUMNS).not.toContain("la_marea_id_url");
    expect(AUTH_USER_COLUMNS).not.toContain("*");
  });

  it("keeps member app reads away from admin-only file URLs", () => {
    expect(MEMBER_USER_COLUMNS).toContain("photo_url");
    expect(MEMBER_USER_COLUMNS).toContain("must_change_password");
    expect(MEMBER_USER_COLUMNS).not.toContain("payment_screenshot_url");
    expect(MEMBER_USER_COLUMNS).not.toContain("la_marea_id_url");
  });

  it("keeps admin app reads complete for verification workflows", () => {
    expect(ADMIN_USER_COLUMNS).toContain("payment_screenshot_url");
    expect(ADMIN_USER_COLUMNS).toContain("la_marea_id_url");
  });

  it("keeps roster reads limited to fields shown in player lists", () => {
    expect(ROSTER_USER_COLUMNS).toBe("id,full_name,avatar_url,photo_url");
    expect(ROSTER_USER_COLUMNS).not.toContain("email");
    expect(ROSTER_USER_COLUMNS).not.toContain("mobile");
    expect(ROSTER_USER_COLUMNS).not.toContain("address");
    expect(ROSTER_USER_COLUMNS).not.toContain("payment_screenshot_url");
  });

  it("limits member payment and no-show reads to the current user", () => {
    expect(getAppDataQueryScope({ isAdmin: false, userId: "user-1" })).toEqual({
      userColumns: MEMBER_USER_COLUMNS,
      paymentUserId: "user-1",
      noShowUserId: "user-1",
    });
  });

  it("keeps admin aggregate reads unfiltered", () => {
    expect(getAppDataQueryScope({ isAdmin: true, userId: "admin-1" })).toEqual({
      userColumns: ADMIN_USER_COLUMNS,
      paymentUserId: null,
      noShowUserId: null,
    });
  });

  it("limits member roster profile reads to the currently displayed game", () => {
    expect(
      getRosterUserIdsForQuery({
        isAdmin: false,
        today: "2026-05-18",
        registrations: [
          { game_date: "2026-05-17", user_id: "past-user" },
          { game_date: "2026-05-18", user_id: "today-user" },
          { game_date: "2026-05-18", user_id: "today-user" },
          { game_date: "2026-05-19", user_id: "future-user" },
        ],
      }),
    ).toEqual(["today-user"]);
  });

  it("keeps admin roster profile reads complete across loaded registrations", () => {
    expect(
      getRosterUserIdsForQuery({
        isAdmin: true,
        today: "2026-05-18",
        registrations: [
          { game_date: "2026-05-17", user_id: "past-user" },
          { game_date: "2026-05-18", user_id: "today-user" },
          { game_date: "2026-05-19", user_id: "future-user" },
        ],
      }),
    ).toEqual(["past-user", "today-user", "future-user"]);
  });

  it("limits member dashboard game reads to today", () => {
    expect(getGameDataQueryScope({ isAdmin: false, pathname: "/dashboard", today: "2026-05-18" })).toEqual({
      gameDate: "2026-05-18",
    });
  });

  it("keeps member calendar game reads unfiltered for visible calendar counts", () => {
    expect(getGameDataQueryScope({ isAdmin: false, pathname: "/calendar", today: "2026-05-18" })).toEqual({
      gameDate: null,
    });
  });

  it("keeps admin game reads unfiltered for admin workflows", () => {
    expect(getGameDataQueryScope({ isAdmin: true, pathname: "/dashboard", today: "2026-05-18" })).toEqual({
      gameDate: null,
    });
  });
});
