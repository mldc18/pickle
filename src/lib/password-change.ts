type PasswordChangeFailure = {
  ok: false;
  status: 401 | 500;
  error: string;
};

export async function changeAuthenticatedUserPassword({
  userId,
  password,
  updatePassword,
  clearPasswordChangeRequired,
}: {
  userId: string | null;
  password: string;
  updatePassword: (userId: string, password: string) => Promise<void>;
  clearPasswordChangeRequired: (userId: string) => Promise<void>;
}): Promise<{ ok: true } | PasswordChangeFailure> {
  if (!userId) {
    return { ok: false, status: 401, error: "Not authenticated." };
  }

  try {
    await updatePassword(userId, password);
    await clearPasswordChangeRequired(userId);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : "Password update failed.",
    };
  }

  return { ok: true };
}
