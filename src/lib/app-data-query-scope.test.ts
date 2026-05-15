import { describe, expect, it } from "vitest";

import {
  ADMIN_USER_COLUMNS,
  AUTH_USER_COLUMNS,
  MEMBER_USER_COLUMNS,
  getAppDataQueryScope,
} from "./app-data-query-scope";

describe("app data query scope", () => {
  it("keeps auth profile reads explicit", () => {
    expect(AUTH_USER_COLUMNS).toContain("id");
    expect(AUTH_USER_COLUMNS).not.toContain("payment_screenshot_url");
    expect(AUTH_USER_COLUMNS).not.toContain("la_marea_id_url");
    expect(AUTH_USER_COLUMNS).not.toContain("*");
  });

  it("keeps member app reads away from admin-only file URLs", () => {
    expect(MEMBER_USER_COLUMNS).toContain("photo_url");
    expect(MEMBER_USER_COLUMNS).not.toContain("payment_screenshot_url");
    expect(MEMBER_USER_COLUMNS).not.toContain("la_marea_id_url");
  });

  it("keeps admin app reads complete for verification workflows", () => {
    expect(ADMIN_USER_COLUMNS).toContain("payment_screenshot_url");
    expect(ADMIN_USER_COLUMNS).toContain("la_marea_id_url");
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
});
