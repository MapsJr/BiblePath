import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedDevotionBySlug, getPublishedDevotions } from "@/data/devotions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function generateStaticParams() {
  return getPublishedDevotions().map((devotion) => ({ slug: devotion.slug }));
}

export default async function DevotionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const devotion = getPublishedDevotionBySlug(slug);

  if (!devotion) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/devotions" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
            ← Back to devotions
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300">
            Home
          </Link>
        </div>

        <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Daily Devotion</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold">{devotion.title}</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{formatDate(devotion.publishedDate)}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {devotion.reference}
          </span>
        </div>

        <div className="mt-6 rounded-xl bg-emerald-50 p-5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Scripture</p>
          <p className="mt-3 text-xl font-semibold italic">{devotion.scriptureText}</p>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Reflection</p>
          <ul className="space-y-3">
            {devotion.reflectionPoints.map((point, index) => (
              <li key={`${devotion.slug}-${index}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-base leading-7 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
                {point}
              </li>
            ))}
          </ul>
        </div>

        {devotion.prayer && (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Prayer</p>
            <p className="mt-3 leading-7">{devotion.prayer}</p>
          </div>
        )}
      </div>
    </main>
  );
}
