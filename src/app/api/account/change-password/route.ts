import { NextResponse } from "next/server";

import { changeAuthenticatedUserPassword } from "@/lib/password-change";
import { changePasswordSchema } from "@/lib/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const parsed = changePasswordSchema.safeParse({
    password: body?.password,
    confirmPassword: body?.password,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const result = await changeAuthenticatedUserPassword({
    userId: user.id,
    password: parsed.data.password,
    updatePassword: async (userId, password) => {
      const adminSupabase = createAdminClient();
      const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
        password,
      });

      if (error) throw new Error(error.message);
    },
    clearPasswordChangeRequired: async (userId) => {
      const adminSupabase = createAdminClient();
      const { error } = await adminSupabase
        .from("users")
        .update({ must_change_password: false })
        .eq("id", userId);

      if (error) throw new Error(error.message);
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
