import { describe, expect, it } from "vitest";

import {
  getMaintenanceModeConfig,
  getMaintenanceResponse,
  isMaintenanceModeEnabled,
} from "./maintenance-mode";

describe("maintenance mode", () => {
  it("is enabled by default until explicitly disabled", () => {
    expect(isMaintenanceModeEnabled(undefined)).toBe(true);
    expect(isMaintenanceModeEnabled("0")).toBe(false);
    expect(isMaintenanceModeEnabled("false")).toBe(false);
    expect(isMaintenanceModeEnabled("1")).toBe(true);
    expect(isMaintenanceModeEnabled("true")).toBe(true);
  });

  it("returns a 503 html response when enabled", async () => {
    const response = getMaintenanceResponse({
      title: "LAMPA is taking a short break",
      message: "We are doing maintenance.",
      retryAfterSeconds: 600,
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("retry-after")).toBe("600");
    await expect(response.text()).resolves.toContain("LAMPA is taking a short break");
  });

  it("reads maintenance config from an env-shaped object", () => {
    expect(
      getMaintenanceModeConfig({
        MAINTENANCE_MODE: "1",
        MAINTENANCE_TITLE: "Offline",
        MAINTENANCE_MESSAGE: "Back soon.",
        MAINTENANCE_RETRY_AFTER: "120",
      }),
    ).toEqual({
      enabled: true,
      title: "Offline",
      message: "Back soon.",
      retryAfterSeconds: 120,
    });
  });
});
