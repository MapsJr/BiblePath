"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getSafeRedirectPath(value: string | null, fallback: string) {
  if (!value) return fallback;

  if (!value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeRedirectPath(searchParams.get("next"), "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(() => {
    const errorCode = searchParams.get("error");

    if (errorCode === "auth_callback_failed") {
      return "This secure sign-in link is invalid or expired. Please try again.";
    }

    if (errorCode === "admin_lookup_error") {
      return "Your session could not be verified against admin_users. Check that the signed-in user belongs to the same Supabase project and that the admin_users RLS policy allows authenticated users to read the row.";
    }

    return "";
  });
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        setError("Incorrect email or password. Please try again.");
        return;
      }

      if (!data.user) {
        setError("Your session could not be verified. Please try again.");
        return;
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (process.env.NODE_ENV !== "production") {
        console.info("[shared-login-check]", {
          userFound: Boolean(data.user),
          userId: data.user?.id ?? null,
          projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
          adminRowFound: Boolean(adminRecord),
          adminQueryError: Boolean(adminError),
          adminErrorCode: adminError?.code ?? null,
          adminErrorMessage: adminError?.message ?? null,
        });
      }

      if (!adminError && adminRecord) {
        const target = getSafeRedirectPath(nextPath || "/admin", "/admin");
        router.replace(target);
        router.refresh();
        return;
      }

      if (adminError) {
        await supabase.auth.signOut();
        setError("This account could not be verified against the admin list. Please try again.");
        return;
      }

      router.replace("/profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      const nextRoute = getSafeRedirectPath(nextPath || "/profile", "/profile");
      redirectTo.searchParams.set("next", nextRoute);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setError("Google sign-in could not be started. Please try again.");
      }
    } catch {
      setError("Google sign-in failed. Please check your provider configuration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">BiblePath</p>
          <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-white">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back. Continue to your BiblePath account.
          </p>
        </header>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium dark:text-white">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium dark:text-white">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-3 outline-none focus:border-emerald-600 dark:border-zinc-700 dark:text-white"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
          >
            Continue with Google
          </button>
        </form>

        <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center justify-between gap-3">
            <Link href="/auth/forgot-password" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Loading sign in...
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
