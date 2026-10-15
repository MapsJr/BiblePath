import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/profile");
  }

  async function handleSignOut() {
    "use server";
    const serverClient = await createClient();
    await serverClient.auth.signOut();
    redirect("/login");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "User";

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : "";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            ← Back to BiblePath
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 text-lg font-bold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profile avatar" width={64} height={64} className="h-full w-full object-cover" unoptimized />
            ) : (
              initials
            )}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Account</p>
            <h1 className="mt-2 text-3xl font-bold dark:text-white">{fullName}</h1>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Email</p>
            <p className="mt-2 text-base font-medium dark:text-white">{user.email ?? "No email available"}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Authentication</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Signed in securely with your Supabase session.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <form action={handleSignOut} className="flex-1">
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              Sign out
            </button>
          </form>

          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-300 px-4 py-3 font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
