import { describe, expect, it, vi } from "vitest";

import { changeAuthenticatedUserPassword } from "./password-change";
import { changePasswordSchema } from "./schemas";

describe("change password form", () => {
  it("requires matching passwords with the app minimum length", () => {
    expect(
      changePasswordSchema.safeParse({
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        password: "new-pass-123",
        confirmPassword: "different-123",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        password: "new-pass-123",
        confirmPassword: "new-pass-123",
      }).success,
    ).toBe(true);
  });

  it("updates the auth password and clears the forced-change flag", async () => {
    const updatePassword = vi.fn(async () => {});
    const clearPasswordChangeRequired = vi.fn(async () => {});

    await expect(
      changeAuthenticatedUserPassword({
        userId: "user-1",
        password: "new-pass-123",
        updatePassword,
        clearPasswordChangeRequired,
      }),
    ).resolves.toEqual({ ok: true });

    expect(updatePassword).toHaveBeenCalledWith("user-1", "new-pass-123");
    expect(clearPasswordChangeRequired).toHaveBeenCalledWith("user-1");
  });

  it("rejects unauthenticated password updates", async () => {
    await expect(
      changeAuthenticatedUserPassword({
        userId: null,
        password: "new-pass-123",
        updatePassword: vi.fn(async () => {}),
        clearPasswordChangeRequired: vi.fn(async () => {}),
      }),
    ).resolves.toEqual({
      ok: false,
      status: 401,
      error: "Not authenticated.",
    });
  });
});
