import { randomInt } from "node:crypto";

import type { UserRole } from "./schemas";

type ResetProfile = {
  id: string;
  role: UserRole;
};

type PasswordResetDecision =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403 | 404 | 500;
      error: string;
    };
type PasswordResetFailure = Extract<PasswordResetDecision, { ok: false }>;

type RandomInt = (max: number) => number;

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*?";
const PASSWORD_CLASSES = [UPPERCASE, LOWERCASE, DIGITS, SYMBOLS] as const;
const PASSWORD_ALPHABET = PASSWORD_CLASSES.join("");
const DEFAULT_TEMPORARY_PASSWORD_LENGTH = 14;

export function getAdminPasswordResetDecision(
  actor: ResetProfile | null,
  target: ResetProfile | null,
): PasswordResetDecision {
  if (!actor) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  if (actor.role !== "admin" && actor.role !== "super_admin") {
    return { ok: false, status: 403, error: "Admin access is required." };
  }

  if (!target) {
    return { ok: false, status: 404, error: "User not found." };
  }

  if (actor.id === target.id) {
    return {
      ok: false,
      status: 403,
      error: "Use your profile password change flow for your own account.",
    };
  }

  if (target.role === "super_admin") {
    return {
      ok: false,
      status: 403,
      error: "Super admin passwords cannot be reset from the admin panel.",
    };
  }

  if (actor.role === "admin" && target.role !== "member") {
    return {
      ok: false,
      status: 403,
      error: "Only super admins can reset another admin's password.",
    };
  }

  return { ok: true };
}

export function generateTemporaryPassword(
  length = DEFAULT_TEMPORARY_PASSWORD_LENGTH,
  getRandomInt: RandomInt = randomInt,
) {
  if (length < PASSWORD_CLASSES.length) {
    throw new Error("Temporary password length must fit every required character class.");
  }

  const chars = PASSWORD_CLASSES.map((characterClass) =>
    characterClass[getRandomInt(characterClass.length)],
  );

  while (chars.length < length) {
    chars.push(PASSWORD_ALPHABET[getRandomInt(PASSWORD_ALPHABET.length)]);
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars.join("");
}

export async function resetUserPasswordAsAdmin({
  actor,
  target,
  generatePassword = generateTemporaryPassword,
  updatePassword,
}: {
  actor: ResetProfile | null;
  target: ResetProfile | null;
  generatePassword?: () => string;
  updatePassword: (targetUserId: string, temporaryPassword: string) => Promise<void>;
}): Promise<PasswordResetFailure | { ok: true; temporaryPassword: string }> {
  const decision = getAdminPasswordResetDecision(actor, target);
  if (!decision.ok) return decision;
  if (!target) return { ok: false, status: 404, error: "User not found." };

  const temporaryPassword = generatePassword();

  try {
    await updatePassword(target.id, temporaryPassword);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Password reset failed.",
    };
  }

  return { ok: true, temporaryPassword };
}
