"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", "/auth/update-password");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirectTo.toString() }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "If that account is registered and email rate limits are not blocking it, a reset link has been sent. Check your inbox and spam folder."
      );
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
            BiblePath
          </p>
          <h1 className="mt-3 text-3xl font-bold dark:text-white">Reset password</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your account email to receive a secure reset link.
          </p>
        </header>

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

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Sending reset link..." : "Send reset link"}
        </button>

        <Link
          href="/login"
          className="inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Back to sign in
        </Link>
      </form>
    </main>
  );
}
