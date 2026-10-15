
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(searchValue: string | null, fallback: string) {
  if (!searchValue) return fallback;

  if (!searchValue.startsWith("/") || searchValue.startsWith("//")) {
    return fallback;
  }

  return searchValue;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const nextPath = getSafeRedirectPath(
    url.searchParams.get("next"),
    "/profile"
  );

  const supabase = await createClient();
  let authError = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = !!error;
  } else if (
    tokenHash &&
    type &&
    ["invite", "recovery", "signup", "magiclink", "email_change", "email"].includes(type)
  ) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as
        | "invite"
        | "recovery"
        | "signup"
        | "magiclink"
        | "email_change"
        | "email",
    });

    authError = !!error;
  } else {
    authError = true;
  }

  if (authError) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", url.origin));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", url.origin));
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth-callback-admin-check]", {
      userFound: Boolean(user),
      userId: user.id,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      adminRowFound: Boolean(adminRecord),
      adminQueryError: Boolean(adminError),
      adminErrorCode: adminError?.code ?? null,
      adminErrorMessage: adminError?.message ?? null,
    });
  }

  if (adminError) {
    return NextResponse.redirect(
      new URL(`/login?error=admin_lookup_error&next=${encodeURIComponent(nextPath)}`, url.origin)
    );
  }

  const target = adminRecord ? "/admin" : "/profile";
  return NextResponse.redirect(new URL(target, url.origin));
}
