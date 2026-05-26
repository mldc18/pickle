import { NextResponse } from "next/server";

import { resetUserPasswordAsAdmin } from "@/lib/admin-password-reset";
import type { UserRole } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: UserRole;
};

const PROFILE_COLUMNS = "id,role";

async function readProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ProfileRow | null;
}

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetUserId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let actor: ProfileRow | null;
  let target: ProfileRow | null;

  try {
    [actor, target] = await Promise.all([
      readProfile(supabase, user.id),
      readProfile(supabase, targetUserId),
    ]);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to read user profiles.",
      },
      { status: 500 },
    );
  }

  const result = await resetUserPasswordAsAdmin({
    actor,
    target,
    updatePassword: async (userId, temporaryPassword) => {
      const adminSupabase = createAdminClient();
      const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
        password: temporaryPassword,
      });

      if (error) throw new Error(error.message);
    },
    markPasswordChangeRequired: async (userId) => {
      const adminSupabase = createAdminClient();
      const { error } = await adminSupabase
        .from("users")
        .update({ must_change_password: true })
        .eq("id", userId);

      if (error) throw new Error(error.message);
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ temporaryPassword: result.temporaryPassword });
}
