import Link from "next/link";
import { getPublishedDevotions } from "@/data/devotions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export const instant = false;

export default function DevotionsPage() {
  const devotions = getPublishedDevotions();

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            ← Back to BiblePath
          </Link>
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Daily Devotions</p>

        {devotions.length ? (
          <div className="mt-6 space-y-4">
            {devotions.map((devotion) => (
              <article key={devotion.slug} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">{devotion.title}</h2>
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{formatDate(devotion.publishedDate)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    {devotion.reference}
                  </span>
                </div>

                <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-200">{devotion.scriptureText}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{devotion.reflectionPoints.length} reflection points</p>
                  <Link href={`/devotions/${devotion.slug}`} className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                    Read devotion
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-300 p-6 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
            No published devotion is available yet.
          </div>
        )}
      </div>
    </main>
  );
}
