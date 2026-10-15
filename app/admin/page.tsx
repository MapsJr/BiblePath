import { signOutAdmin } from "./actions";
import { requireAdminAccess } from "@/lib/supabase/admin";

export const instant = false;

export default async function AdminPage() {
  const { user } = await requireAdminAccess();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-5xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
              BiblePath
            </p>
            <h1 className="mt-3 text-3xl font-bold">Admin dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <form action={signOutAdmin}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-emerald-50 p-5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Signed in</p>
          <p className="mt-3 text-lg font-medium">{user.email}</p>
          <p className="mt-2 text-sm">
            Server-side access is verified against the existing admin_users table before this page loads.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Access control</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Only the authorised administrator account can manage BiblePath admin content.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">Content management</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Devotions and prayer entries remain restricted to authorised admin workflows.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="text-lg font-semibold">User safety</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Ordinary users are redirected away from admin-only routes unless their Supabase UUID matches the admin_users record.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
