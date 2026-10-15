import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AdminAccessReason =
  | "ok"
  | "unauthenticated"
  | "auth_error"
  | "not_admin"
  | "admin_lookup_error";

export async function getAdminAccessState() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[admin-check] auth error", {
        userFound: false,
        userId: null,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      });
    }

    return { ok: false, reason: "auth_error" as const, user: null, supabase };
  }

  if (!user) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[admin-check] unauthenticated", {
        userFound: false,
        userId: null,
        projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      });
    }

    return { ok: false, reason: "unauthenticated" as const, user: null, supabase };
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (process.env.NODE_ENV !== "production") {
    console.info("[admin-check] lookup result", {
      userFound: true,
      userId: user.id,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      adminRowFound: Boolean(adminRecord),
      adminQueryError: Boolean(adminError),
      adminErrorCode: adminError?.code ?? null,
      adminErrorMessage: adminError?.message ?? null,
    });
  }

  if (adminError) {
    return { ok: false, reason: "admin_lookup_error" as const, user, supabase };
  }

  if (!adminRecord) {
    return { ok: false, reason: "not_admin" as const, user, supabase };
  }

  return { ok: true, reason: "ok" as const, user, supabase };
}

export async function getAdminUserSession() {
  const state = await getAdminAccessState();
  if (!state.ok || !state.user) {
    return null;
  }

  return { supabase: state.supabase, user: state.user };
}

export async function requireAdminAccess() {
  const state = await getAdminAccessState();

  if (!state.ok) {
    if (state.reason === "unauthenticated") {
      redirect("/login?next=/admin");
    }

    if (state.reason === "auth_error") {
      redirect("/login?next=/admin&error=auth_error");
    }

    if (state.reason === "admin_lookup_error") {
      redirect("/login?next=/admin&error=admin_lookup_error");
    }

    redirect("/login?next=/admin&error=not_admin");
  }

  return { supabase: state.supabase, user: state.user! };
}

