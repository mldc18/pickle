import { describe, expect, it, vi } from "vitest";

import {
  generateTemporaryPassword,
  getAdminPasswordResetDecision,
  resetUserPasswordAsAdmin,
} from "./admin-password-reset";

describe("admin password reset", () => {
  it("allows admins to reset members", () => {
    expect(
      getAdminPasswordResetDecision(
        { id: "admin-1", role: "admin" },
        { id: "member-1", role: "member" },
      ),
    ).toEqual({ ok: true });
  });

  it("prevents regular admins from resetting admin accounts", () => {
    expect(
      getAdminPasswordResetDecision(
        { id: "admin-1", role: "admin" },
        { id: "admin-2", role: "admin" },
      ),
    ).toEqual({
      ok: false,
      status: 403,
      error: "Only super admins can reset another admin's password.",
    });
  });

  it("prevents resetting the signed-in admin or any super admin", () => {
    expect(
      getAdminPasswordResetDecision(
        { id: "admin-1", role: "super_admin" },
        { id: "admin-1", role: "super_admin" },
      ),
    ).toEqual({
      ok: false,
      status: 403,
      error: "Use your profile password change flow for your own account.",
    });

    expect(
      getAdminPasswordResetDecision(
        { id: "admin-1", role: "super_admin" },
        { id: "admin-2", role: "super_admin" },
      ),
    ).toEqual({
      ok: false,
      status: 403,
      error: "Super admin passwords cannot be reset from the admin panel.",
    });
  });

  it("generates a temporary password with required character classes", () => {
    const password = generateTemporaryPassword(12, () => 0);

    expect(password).toHaveLength(12);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[!@#$%&*?]/);
  });

  it("updates the Supabase Auth password and returns the temporary password", async () => {
    const updatePassword = vi.fn(async () => {});
    const markPasswordChangeRequired = vi.fn(async () => {});

    await expect(
      resetUserPasswordAsAdmin({
        actor: { id: "super-1", role: "super_admin" },
        target: { id: "admin-1", role: "admin" },
        generatePassword: () => "TempPass123!",
        updatePassword,
        markPasswordChangeRequired,
      }),
    ).resolves.toEqual({ ok: true, temporaryPassword: "TempPass123!" });

    expect(updatePassword).toHaveBeenCalledWith("admin-1", "TempPass123!");
    expect(markPasswordChangeRequired).toHaveBeenCalledWith("admin-1");
  });
});
