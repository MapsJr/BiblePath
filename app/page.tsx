
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPublishedDevotions } from "@/data/devotions";
import { createClient } from "@/lib/supabase/client";

const BOOKS = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36],
  ["Deuteronomy", 34], ["Joshua", 24], ["Judges", 21], ["Ruth", 4],
  ["1 Samuel", 31], ["2 Samuel", 24], ["1 Kings", 22], ["2 Kings", 25],
  ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10], ["Nehemiah", 13],
  ["Esther", 10], ["Job", 42], ["Psalms", 150], ["Proverbs", 31],
  ["Ecclesiastes", 12], ["Song of Solomon", 8], ["Isaiah", 66],
  ["Jeremiah", 52], ["Lamentations", 5], ["Ezekiel", 48], ["Daniel", 12],
  ["Hosea", 14], ["Joel", 3], ["Amos", 9], ["Obadiah", 1], ["Jonah", 4],
  ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3], ["Zephaniah", 3],
  ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4], ["Matthew", 28],
  ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28],
  ["Romans", 16], ["1 Corinthians", 16], ["2 Corinthians", 13],
  ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4], ["Colossians", 4],
  ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6],
  ["2 Timothy", 4], ["Titus", 3], ["Philemon", 1], ["Hebrews", 13],
  ["James", 5], ["1 Peter", 5], ["2 Peter", 3], ["1 John", 5],
  ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22],
] as const;

type Verse = { verse: number; text: string };
type SavedVerse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  color?: string;
};
type Prayer = {
  id: string;
  title: string;
  text: string;
  answered: boolean;
  createdAt: string;
};
type ThemeChoice = "light" | "dark" | "system";

const VERSE_OF_DAY = [
  { ref: "Psalm 23:1", text: "The LORD is my shepherd; I shall not want.", encouragement: "God cares for you and guides you, even when the way ahead is uncertain." },
  { ref: "Proverbs 3:5-6", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", encouragement: "You do not need to understand everything before you can trust God." },
  { ref: "Philippians 4:6", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", encouragement: "Bring your worries to God in prayer, one thing at a time." },
  { ref: "Joshua 1:9", text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", encouragement: "Take your next step with courage, remembering that you are not alone." },
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", encouragement: "Let God's Word help you choose your next step." },
  { ref: "Matthew 5:16", text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", encouragement: "Let kindness and good choices reflect your faith today." },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", encouragement: "Even difficult seasons can become part of a bigger story." },
];

const STORAGE = {
  bookmarks: "biblepath_bookmarks_v1",
  highlights: "biblepath_highlights_v1",
  devotions: "biblepath_devotions_v1",
  prayers: "biblepath_prayers_v1",
  theme: "biblepath_theme_v1",
};

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fde68a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Purple", value: "#ddd6fe" },
];

const NAV = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "bible", label: "Read Bible", icon: "▤" },
  { id: "saved", label: "Saved Verses", icon: "☆" },
  { id: "highlights", label: "Highlights", icon: "✎" },
  { id: "devotions", label: "Daily Devotions", icon: "♡" },
  { id: "prayers", label: "Prayer Journal", icon: "☼" },
  { id: "plans", label: "Reading Plans", icon: "☷" },
  { id: "community", label: "Community", icon: "♧" },
  { id: "audio", label: "Audio Bible", icon: "♫" },
] as const;

type Page = (typeof NAV)[number]["id"];

function readStorage<T,>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getVerseDayForDate(date: Date) {
  const dayNumber = Math.floor(
    new Date(`${dateKey(date)}T00:00:00`).getTime() / 86400000
  );
  return VERSE_OF_DAY[((dayNumber % VERSE_OF_DAY.length) + VERSE_OF_DAY.length) % VERSE_OF_DAY.length];
}

function getChapterCount(book: string) {
  return BOOKS.find(([name]) => name === book)?.[1] ?? 1;
}

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

function cleanReference(book: string, chapter: number, verse: number) {
  return `${book} ${chapter}:${verse}`;
}

function Card({ children, className = "", panel }: { children: React.ReactNode; className?: string; panel: string }) {
  return <section className={`rounded-2xl border p-5 shadow-sm ${panel} ${className}`}>{children}</section>;
}

function Heading({ children, subtitle, muted }: { children: React.ReactNode; subtitle?: string; muted: string }) {
  return <div className="mb-5"><h2 className="text-2xl font-bold tracking-tight">{children}</h2>{subtitle && <p className={`mt-1 text-sm ${muted}`}>{subtitle}</p>}</div>;
}

function VerseCard({ item, saved = false, onOpen, dark, secondary, openReference, setBookmarks }: { item: SavedVerse; saved?: boolean; onOpen?: () => void; dark: boolean; secondary: string; openReference: (reference: string) => void; setBookmarks: React.Dispatch<React.SetStateAction<SavedVerse[]>>; }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? "border-slate-800" : "border-slate-200"}`}>
      <button onClick={onOpen ?? (() => openReference(`${item.book} ${item.chapter}:${item.verse}`))} className="text-left font-semibold text-emerald-500 hover:underline">
        {cleanReference(item.book, item.chapter, item.verse)}
      </button>
      <p className="mt-2 leading-7">{item.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={secondary} onClick={() => openReference(`${item.book} ${item.chapter}:${item.verse}`)}>Read chapter</button>
        {saved && <button className={secondary} onClick={() => setBookmarks((old) => old.filter((v) => v.id !== item.id))}>Remove</button>}
      </div>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState<Page>("home");
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loadingBible, setLoadingBible] = useState(false);
  const [bibleError, setBibleError] = useState("");
  const [bookmarks, setBookmarks] = useState<SavedVerse[]>(() => readStorage(STORAGE.bookmarks, []));
  const [highlights, setHighlights] = useState<SavedVerse[]>(() => readStorage(STORAGE.highlights, []));
  const [prayers, setPrayers] = useState<Prayer[]>(() => readStorage(STORAGE.prayers, []));
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  const chapterTop = useRef<HTMLDivElement>(null);

  const [prayerTitle, setPrayerTitle] = useState("");
  const [prayerText, setPrayerText] = useState("");

  const [audioBook, setAudioBook] = useState("John");
  const [audioChapter, setAudioChapter] = useState(1);
  const [audioText, setAudioText] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [readingPlanDay, setReadingPlanDay] = useState(1);
  const [verseOfDay, setVerseOfDay] = useState<(typeof VERSE_OF_DAY)[number]>(VERSE_OF_DAY[0]);

  const audioSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const dark = useMemo(() => {
    if (themeChoice === "dark") return true;
    if (themeChoice === "light") return false;
    return systemDark;
  }, [systemDark, themeChoice]);

  useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const isSessionUser = Boolean(user);
      setIsSignedIn(isSessionUser);
      setProfileAvatar(
        typeof user?.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user?.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null
      );
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setIsSignedIn(Boolean(user));
      setProfileAvatar(
        typeof user?.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : typeof user?.user_metadata?.picture === "string"
            ? user.user_metadata.picture
            : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const applyBrowserPreferences = () => {
      const savedTheme = readStorage<ThemeChoice>(STORAGE.theme, "system");
      if (isThemeChoice(savedTheme)) {
        setThemeChoice(savedTheme);
      }

      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const updateSystemDark = () => setSystemDark(media.matches);
      updateSystemDark();
      media.addEventListener("change", updateSystemDark);

      setVerseOfDay(getVerseDayForDate(new Date()));

      return () => media.removeEventListener("change", updateSystemDark);
    };

    const cleanup = applyBrowserPreferences();
    return cleanup;
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(STORAGE.highlights, JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem(STORAGE.prayers, JSON.stringify(prayers));
  }, [prayers]);

  useEffect(() => {
    localStorage.setItem(STORAGE.theme, JSON.stringify(themeChoice));
  }, [themeChoice]);

  useEffect(() => {
    if (themeChoice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [themeChoice]);

  useEffect(() => {
    let active = true;
    async function loadChapter() {
      setLoadingBible(true);
      setBibleError("");
      setVerses([]);
      try {
        const ref = encodeURIComponent(`${book} ${chapter}`);
        const response = await fetch(`https://bible-api.com/${ref}?translation=kjv`);
        if (!response.ok) throw new Error("The Bible service could not load this chapter.");
        const data = await response.json();
        if (active) setVerses((data.verses ?? []).map((v: Verse) => ({ verse: v.verse, text: v.text.trim() })));
      } catch {
        if (active) setBibleError("We couldn't load this chapter. Check your internet connection and try again.");
      } finally {
        if (active) setLoadingBible(false);
      }
    }
    loadChapter();
    return () => { active = false; };
  }, [book, chapter]);

  useEffect(() => {
    chapterTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [book, chapter]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const savedVerseIds = useMemo(
    () => new Set(bookmarks.map((v) => `${v.book}|${v.chapter}|${v.verse}`)),
    [bookmarks]
  );

  function showMessage(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  async function copyTextToClipboard(text: string) {
    if (!text.trim()) {
      return;
    }

    if (typeof document === "undefined" || !document.hasFocus()) {
      showMessage("Please focus the page and click again to copy.");
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        showMessage("Verse copied.");
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        document.body.removeChild(textarea);
      }

      if (copied) {
        showMessage("Verse copied.");
        return;
      }

      throw new Error("Copy command unavailable.");
    } catch {
      showMessage("Copy is unavailable. You can select the verse text manually.");
    }
  }

  function setTheme(choice: ThemeChoice) {
    setThemeChoice(choice);
  }

  function moveChapter(direction: number) {
    const currentIndex = BOOKS.findIndex(([name]) => name === book);
    const count = getChapterCount(book);
    if (chapter + direction >= 1 && chapter + direction <= count) {
      setChapter(chapter + direction);
      return;
    }
    const nextBookIndex = currentIndex + direction;
    if (nextBookIndex < 0 || nextBookIndex >= BOOKS.length) return;
    const nextBook = BOOKS[nextBookIndex];
    setBook(nextBook[0]);
    setChapter(direction > 0 ? 1 : nextBook[1]);
  }

  function openReference(reference: string) {
    const match = reference.trim().match(/^(.+?)\s+(\d+)(?::\d+(?:-\d+)?)?$/);
    if (!match) {
      showMessage("Enter a reference like John 3:16.");
      return;
    }
    const foundBook = BOOKS.find(([name]) => name.toLowerCase() === match[1].toLowerCase());
    if (!foundBook) {
      showMessage("We couldn't recognise that Bible book.");
      return;
    }
    const foundChapter = Number(match[2]);
    if (foundChapter < 1 || foundChapter > foundBook[1]) {
      showMessage("That chapter doesn't exist in this book.");
      return;
    }
    setBook(foundBook[0]);
    setChapter(foundChapter);
    setPage("bible");
  }

  function saveBookmark(verse: Verse) {
    const id = `${book}|${chapter}|${verse.verse}`;
    if (savedVerseIds.has(id)) {
      setBookmarks((old) => old.filter((v) => `${v.book}|${v.chapter}|${v.verse}` !== id));
      showMessage("Bookmark removed.");
      return;
    }
    setBookmarks((old) => [...old, {
      id: makeId(), book, chapter, verse: verse.verse, text: verse.text
    }]);
    showMessage("Verse bookmarked.");
  }

  function toggleHighlight(verse: Verse, color: string) {
    const id = `${book}|${chapter}|${verse.verse}`;
    setHighlights((old) => {
      const existing = old.find((v) => `${v.book}|${v.chapter}|${v.verse}` === id);
      if (existing?.color === color) {
        showMessage("Highlight removed.");
        return old.filter((v) => `${v.book}|${v.chapter}|${v.verse}` !== id);
      }
      showMessage("Verse highlighted.");
      return [
        ...old.filter((v) => `${v.book}|${v.chapter}|${v.verse}` !== id),
        { id: existing?.id ?? makeId(), book, chapter, verse: verse.verse, text: verse.text, color },
      ];
    });
  }

  function savePrayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prayerTitle.trim() || !prayerText.trim()) return;
    setPrayers((old) => [{
      id: makeId(),
      title: prayerTitle.trim(),
      text: prayerText.trim(),
      answered: false,
      createdAt: new Date().toISOString(),
    }, ...old]);
    setPrayerTitle("");
    setPrayerText("");
    showMessage("Prayer saved.");
  }

  function togglePrayer(id: string) {
    setPrayers((old) => old.map((p) => p.id === id ? { ...p, answered: !p.answered } : p));
  }

  function playAudio() {
    if (!audioSupported) {
      showMessage("Audio narration isn't supported by this browser.");
      return;
    }
    if (audioPlaying) {
      window.speechSynthesis.pause();
      setAudioPlaying(false);
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setAudioPlaying(true);
      return;
    }
    const text = audioText.trim();
    if (!text) {
      showMessage("Load a chapter first.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setAudioPlaying(false);
    utterance.onerror = () => setAudioPlaying(false);
    setAudioPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  async function loadAudioChapter() {
    setAudioPlaying(false);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    try {
      const response = await fetch(`https://bible-api.com/${encodeURIComponent(`${audioBook} ${audioChapter}`)}?translation=kjv`);
      if (!response.ok) throw new Error("Could not load chapter.");
      const data = await response.json();
      const text = (data.verses ?? []).map((v: Verse) => `${v.verse}. ${v.text}`).join(" ");
      setAudioText(text);
      showMessage("Chapter ready for narration.");
    } catch {
      showMessage("Couldn't load the chapter. Check your connection.");
    }
  }

  const filteredSaved = bookmarks.filter((v) =>
    `${v.book} ${v.chapter}:${v.verse} ${v.text}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredHighlights = highlights.filter((v) =>
    `${v.book} ${v.chapter}:${v.verse} ${v.text}`.toLowerCase().includes(search.toLowerCase())
  );

  const publishedDevotions = getPublishedDevotions();

  const bg = dark ? "bg-slate-950 text-slate-100" : "bg-[#f7f8f4] text-slate-800";
  const panel = dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200";
  const muted = dark ? "text-slate-400" : "text-slate-500";
  const inputStyle = `w-full rounded-xl border px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 ${dark ? "bg-slate-950 border-slate-700 text-slate-100" : "bg-white border-slate-300 text-slate-800"}`;
  const buttonStyle = `rounded-xl px-4 py-2.5 font-medium transition hover:opacity-85 disabled:opacity-40`;
  const primary = `${buttonStyle} bg-emerald-700 text-white`;
  const secondary = `${buttonStyle} border ${dark ? "border-slate-700 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`;
  const accountHref = isSignedIn ? "/profile" : "/login";
  const accountLabel = isSignedIn ? "Profile" : "Login";
  const accountIcon = isSignedIn ? "👤" : "◉";

  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      <header className={`sticky top-0 z-20 border-b backdrop-blur ${dark ? "bg-slate-950/90 border-slate-800" : "bg-white/90 border-slate-200"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => setPage("home")} className="flex items-center gap-3 text-left">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 text-xl text-white">✝</span>
            <span><span className="block text-lg font-bold tracking-tight">BiblePath</span><span className={`block text-xs ${muted}`}>Grow in the Word</span></span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/devotions"
              className="inline-flex items-center rounded-xl border border-emerald-600 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 sm:px-4 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-slate-800"
            >
              Daily Devotions
            </Link>
            <Link
              href={accountHref}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 sm:px-4"
            >
              {profileAvatar ? (
                <Image src={profileAvatar} alt="Profile avatar" width={20} height={20} className="h-5 w-5 rounded-full object-cover" unoptimized />
              ) : (
                <span aria-hidden="true" className="text-base">{accountIcon}</span>
              )}
              <span>{accountLabel}</span>
            </Link>
            <label className="hidden text-sm sm:block" htmlFor="theme">Theme</label>
            <select id="theme" className={`${inputStyle} !w-auto !py-2 text-sm`} value={themeChoice} onChange={(e) => setTheme(e.target.value as ThemeChoice)}>
              <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border p-3 lg:sticky lg:top-6">
          <p className={`px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider ${muted}`}>Your space</p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {NAV.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${page === item.id ? "bg-emerald-700 text-white" : "hover:bg-emerald-700/10"}`}>
                <span className="w-5 text-center text-lg">{item.icon}</span>{item.label}
              </button>
            ))}
            <Link
              href={accountHref}
              className={`mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${dark ? "hover:bg-slate-800" : "hover:bg-emerald-700/10"}`}
            >
              {profileAvatar ? (
                <Image src={profileAvatar} alt="Profile avatar" width={20} height={20} className="h-5 w-5 rounded-full object-cover" unoptimized />
              ) : (
                <span className="w-5 text-center text-lg" aria-hidden="true">{accountIcon}</span>
              )}
              <span>{accountLabel}</span>
            </Link>
          </nav>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <label htmlFor="theme" className={`mb-2 block text-xs font-bold uppercase tracking-wider ${muted}`}>Theme</label>
            <select id="theme" className={`${inputStyle} !w-full !py-2 text-sm`} value={themeChoice} onChange={(e) => setTheme(e.target.value as ThemeChoice)}>
              <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
            </select>
          </div>
          <div className={`mt-4 rounded-xl p-3 text-xs leading-5 ${dark ? "bg-slate-800" : "bg-emerald-50 text-emerald-900"}`}>
            <p className="font-semibold">A little each day</p>
            <p className="mt-1">Read, reflect, pray, and keep growing.</p>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          {message && <div role="status" className="fixed right-4 top-20 z-50 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-lg">{message}</div>}

          {page === "home" && <>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-7 text-white sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Welcome to BiblePath</p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">Make room for the Word in your everyday life.</h1>
              <p className="mt-4 max-w-xl leading-7 text-emerald-50">Read Scripture, save the verses that speak to you, and build a personal devotional habit.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-xl bg-white px-5 py-3 font-semibold text-emerald-900 hover:bg-emerald-50" onClick={() => setPage("bible")}>Start reading →</button>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Card panel={panel}>
                <p className={`text-sm font-semibold uppercase tracking-wider ${muted}`}>Verse of the Day · KJV</p>
                <h2 className="mt-3 text-2xl font-bold">{verseOfDay.ref}</h2>
                <p className="mt-3 text-lg leading-8">{verseOfDay.text}</p>
                <p className={`mt-3 text-sm leading-6 ${muted}`}>{verseOfDay.encouragement}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className={primary} onClick={() => openReference(verseOfDay.ref)}>Read in context</button>
                  <button className={secondary} onClick={() => void copyTextToClipboard(`${verseOfDay.ref}\n${verseOfDay.text}`)}>Copy verse</button>
                </div>
              </Card>
              <Card panel={panel}>
                <p className={`text-sm font-semibold uppercase tracking-wider ${muted}`}>Your journey</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[["Saved verses", bookmarks.length], ["Highlights", highlights.length], ["Devotions", publishedDevotions.length], ["Prayer notes", prayers.length]].map(([label, count]) => (
                    <div key={label} className={`rounded-xl p-4 ${dark ? "bg-slate-800" : "bg-slate-50"}`}>
                      <p className="text-2xl font-bold">{count}</p><p className={`mt-1 text-sm ${muted}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <Card panel={panel}>
              <Heading subtitle="Pick up where you want to grow today." muted={muted}>Quick access</Heading>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {NAV.filter((n) => n.id !== "home").map((item) => (
                  <button key={item.id} onClick={() => setPage(item.id)} className={`rounded-xl border p-4 text-left transition hover:border-emerald-500 ${dark ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-emerald-50"}`}>
                    <span className="text-2xl text-emerald-600">{item.icon}</span><p className="mt-2 font-semibold">{item.label}</p><p className={`mt-1 text-sm ${muted}`}>Open {item.label.toLowerCase()}</p>
                  </button>
                ))}
              </div>
            </Card>
          </>}

          {page === "bible" && <>
            <Heading subtitle="Read a chapter, save a verse, or mark a passage for later." muted={muted}>Bible Reader</Heading>
            <Card panel={panel}>
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
                <div><label className="mb-1 block text-sm font-medium">Book</label><select className={inputStyle} value={book} onChange={(e) => {setBook(e.target.value); setChapter(1);}}>{BOOKS.map(([name]) => <option key={name}>{name}</option>)}</select></div>
                <div><label className="mb-1 block text-sm font-medium">Chapter</label><select className={inputStyle} value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>{Array.from({length: getChapterCount(book)}, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <div className="flex items-end"><button className={primary} onClick={() => setPage("bible")}>Open chapter</button></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={secondary} disabled={book === BOOKS[0][0] && chapter === 1} onClick={() => moveChapter(-1)}>← Previous</button>
                <button className={secondary} disabled={book === BOOKS[BOOKS.length - 1][0] && chapter === getChapterCount(book)} onClick={() => moveChapter(1)}>Next →</button>
              </div>
            </Card>
            <div ref={chapterTop} />
            <Card panel={panel}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className={`text-sm ${muted}`}>King James Version</p><h2 className="mt-1 text-3xl font-bold">{book} {chapter}</h2></div>
                <span className={`rounded-lg px-3 py-1 text-sm ${dark ? "bg-slate-800" : "bg-emerald-50 text-emerald-800"}`}>{verses.length} verses</span>
              </div>
              {loadingBible && <p className={`py-8 ${muted}`}>Loading Scripture…</p>}
              {bibleError && <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-800"><p>{bibleError}</p><button className="mt-2 underline" onClick={() => setChapter((c) => c)}>Try again</button></div>}
              {!loadingBible && !bibleError && <div className="mt-5 space-y-1">
                {verses.map((v) => {
                  const id = `${book}|${chapter}|${v.verse}`;
                  const highlight = highlights.find((h) => `${h.book}|${h.chapter}|${h.verse}` === id);
                  return <div key={v.verse} className="group rounded-lg px-3 py-3" style={{backgroundColor: highlight?.color ?? "transparent"}}>
                    <div className="flex gap-3">
                      <span className="pt-1 text-xs font-bold text-emerald-600">{v.verse}</span>
                      <div className="min-w-0 flex-1">
                        <p className="leading-8">{v.text}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 opacity-100 sm:opacity-70 sm:group-hover:opacity-100">
                          <button className="rounded-lg border border-slate-300/60 px-2 py-1 text-xs" onClick={() => saveBookmark(v)}>{savedVerseIds.has(id) ? "★ Saved" : "☆ Save"}</button>
                          <span className="text-xs">Highlight:</span>
                          {HIGHLIGHT_COLORS.map((c) => <button key={c.value} aria-label={`Highlight ${c.name}`} title={c.name} onClick={() => toggleHighlight(v, c.value)} className="h-6 w-6 rounded-full border border-slate-500/30" style={{backgroundColor: c.value, outline: highlight?.color === c.value ? "2px solid currentColor" : "none", outlineOffset: 2}} />)}
                        </div>
                      </div>
                    </div>
                  </div>;
                })}
              </div>}
              <div className="mt-5 flex justify-between gap-3 border-t border-slate-300/30 pt-4">
                <button className={secondary} disabled={book === BOOKS[0][0] && chapter === 1} onClick={() => moveChapter(-1)}>← Previous chapter</button>
                <button className={primary} disabled={book === BOOKS[BOOKS.length - 1][0] && chapter === getChapterCount(book)} onClick={() => moveChapter(1)}>Next chapter →</button>
              </div>
            </Card>
          </>}

          {page === "saved" && <>
            <Heading subtitle="Keep meaningful passages close at hand." muted={muted}>Saved Verses</Heading>
            <input className={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved verses…" />
            {filteredSaved.length ? <div className="grid gap-3 md:grid-cols-2">{filteredSaved.map((v) => <VerseCard key={v.id} item={v} saved dark={dark} secondary={secondary} openReference={openReference} setBookmarks={setBookmarks} />)}</div> : <Card panel={panel}><p className={muted}>No saved verses found. Open the Bible reader and tap ☆ Save beside a verse.</p></Card>}
          </>}

          {page === "highlights" && <>
            <Heading subtitle="Review the passages you have highlighted." muted={muted}>Highlights</Heading>
            <input className={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search highlights…" />
            {filteredHighlights.length ? <div className="grid gap-3 md:grid-cols-2">{filteredHighlights.map((v) => <div key={v.id} style={{borderLeft: `5px solid ${v.color ?? "#fde68a"}`}}><VerseCard item={v} dark={dark} secondary={secondary} openReference={openReference} setBookmarks={setBookmarks} /><button className={`${secondary} mt-2`} onClick={() => setHighlights((old) => old.filter((h) => h.id !== v.id))}>Remove highlight</button></div>)}</div> : <Card panel={panel}><p className={muted}>No highlights yet. Choose a colour beside a verse in the Bible reader.</p></Card>}
          </>}

          {page === "devotions" && <>
            <Heading subtitle="Published devotion content is maintained in code." muted={muted}>Daily Devotions</Heading>
            {publishedDevotions.length ? (
              <div className="space-y-4">
                {publishedDevotions.map((devotion) => (
                  <Card key={devotion.slug} panel={panel}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{devotion.title}</h3>
                        <p className={`mt-1 text-sm ${muted}`}>{devotion.reference}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(devotion.publishedDate))}
                      </span>
                    </div>
                    <blockquote className={`mt-4 border-l-4 border-emerald-600 pl-4 leading-7 ${muted}`}>{devotion.scriptureText}</blockquote>
                    <ul className="mt-4 space-y-2 leading-7">
                      {devotion.reflectionPoints.map((point, index) => (
                        <li key={`${devotion.slug}-${index}`}>✓ {point}</li>
                      ))}
                    </ul>
                    <div className="mt-4 flex justify-end">
                      <Link href={`/devotions/${devotion.slug}`} className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
                        Read devotion
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card panel={panel}><p className={muted}>No published devotions are available right now.</p></Card>
            )}
          </>}

          {page === "prayers" && <>
            <Heading subtitle="Keep track of what you are praying about and remember answered prayers." muted={muted}>Prayer Journal</Heading>
            <Card panel={panel}>
              <form onSubmit={savePrayer} className="space-y-3">
                <div><label className="mb-1 block text-sm font-medium">Prayer title</label><input className={inputStyle} required value={prayerTitle} onChange={(e) => setPrayerTitle(e.target.value)} placeholder="What are you praying about?" /></div>
                <div><label className="mb-1 block text-sm font-medium">Your prayer or notes</label><textarea className={inputStyle} required rows={4} value={prayerText} onChange={(e) => setPrayerText(e.target.value)} placeholder="Write your prayer here…" /></div>
                <button className={primary} type="submit">Save prayer</button>
              </form>
            </Card>
            {prayers.length ? <div className="space-y-3">{prayers.map((p) => <Card key={p.id} panel={panel}><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{p.title}</h3><p className={`mt-1 text-xs ${muted}`}>{new Date(p.createdAt).toLocaleDateString()}</p></div><button className={secondary} onClick={() => togglePrayer(p.id)}>{p.answered ? "✓ Answered" : "Mark answered"}</button></div><p className="mt-3 whitespace-pre-wrap leading-7">{p.text}</p><button className="mt-3 text-sm text-red-500 hover:underline" onClick={() => setPrayers((old) => old.filter((item) => item.id !== p.id))}>Delete prayer</button></Card>)}</div> : <Card panel={panel}><p className={muted}>Your prayer journal is ready when you are.</p></Card>}
          </>}

          {page === "plans" && <>
            <Heading subtitle="A simple 7-day plan to help you build a steady reading habit." muted={muted}>Reading Plans</Heading>
            <Card panel={panel}>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Getting to Know Jesus</h3><p className={`mt-1 text-sm ${muted}`}>A seven-day journey through the Gospel of John.</p></div><span className="rounded-lg bg-emerald-700/10 px-3 py-2 text-sm font-semibold text-emerald-600">Day {readingPlanDay} of 7</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-300/40"><div className="h-full rounded-full bg-emerald-600" style={{width: `${readingPlanDay / 7 * 100}%`}} /></div>
              <div className="mt-5 space-y-2">
                {["John 1", "John 2", "John 3", "John 4", "John 5", "John 6", "John 7"].map((ref, i) => <button key={ref} onClick={() => {setReadingPlanDay(i + 1); openReference(ref);}} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${readingPlanDay === i + 1 ? "border-emerald-600 bg-emerald-700/10" : dark ? "border-slate-800" : "border-slate-200"}`}><span><span className="mr-3 text-emerald-600">{i + 1 <= readingPlanDay ? "✓" : "○"}</span>{ref}</span><span className={`text-sm ${muted}`}>Read →</span></button>)}
              </div>
              <button className={`${primary} mt-4`} onClick={() => setReadingPlanDay((d) => d >= 7 ? 1 : d + 1)}>{readingPlanDay === 7 ? "Restart plan" : "Mark day complete"}</button>
            </Card>
          </>}

          {page === "community" && <>
            <Heading subtitle="A place for future community features." muted={muted}>Community</Heading>
            <Card panel={panel}>
              <div className="text-4xl">♧</div><h3 className="mt-3 text-xl font-bold">Grow together in faith</h3>
              <p className={`mt-2 leading-7 ${muted}`}>This section is a placeholder for a future community space where you could share encouragement, discuss Scripture, or join group reading plans.</p>
              <p className={`mt-3 text-sm ${muted}`}>Community posting and accounts are not connected yet.</p>
            </Card>
          </>}

          {page === "audio" && <>
            <Heading subtitle="Listen to a chapter using your browser text-to-speech voice." muted={muted}>Audio Bible</Heading>
            <Card panel={panel}>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div><label className="mb-1 block text-sm font-medium">Book</label><select className={inputStyle} value={audioBook} onChange={(e) => {setAudioBook(e.target.value);setAudioChapter(1);setAudioText("");}}>{BOOKS.map(([name]) => <option key={name}>{name}</option>)}</select></div>
                <div><label className="mb-1 block text-sm font-medium">Chapter</label><select className={inputStyle} value={audioChapter} onChange={(e) => {setAudioChapter(Number(e.target.value));setAudioText("");}}>{Array.from({length: getChapterCount(audioBook)}, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}</select></div>
              </div>
              <button className={primary} onClick={loadAudioChapter}>Load chapter</button>
              <div className={`mt-5 rounded-2xl p-5 ${dark ? "bg-slate-800" : "bg-emerald-50"}`}>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-700 text-2xl text-white">♫</div>
                <h3 className="mt-3 text-center text-xl font-bold">{audioBook} {audioChapter}</h3>
                <p className={`mt-1 text-center text-sm ${muted}`}>{audioText ? "Chapter ready to listen" : "Load a chapter to begin"}</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button className={secondary} disabled={!audioText} onClick={() => {setAudioChapter((c) => Math.max(1, c - 1));setAudioText("");setAudioPlaying(false);if ("speechSynthesis" in window) window.speechSynthesis.cancel();}}>Previous</button>
                  <button className={primary} disabled={!audioText || !audioSupported} onClick={playAudio}>{audioPlaying ? "Ⅱ Pause" : "▶ Play"}</button>
                  <button className={secondary} disabled={!audioText} onClick={() => {setAudioChapter((c) => Math.min(getChapterCount(audioBook), c + 1));setAudioText("");setAudioPlaying(false);if ("speechSynthesis" in window) window.speechSynthesis.cancel();}}>Next</button>
                </div>
                <p className={`mt-4 text-center text-xs ${muted}`}>Uses your browser speech voice, not a professional recorded Bible audiobook.</p>
              </div>
              {audioText && <div className={`mt-4 max-h-64 overflow-y-auto rounded-xl border p-4 text-sm leading-7 ${dark ? "border-slate-700" : "border-slate-200"}`}>{audioText}</div>}
            </Card>
          </>}
        </main>
      </div>

      <footer className={`border-t px-4 py-6 text-center text-sm ${muted} ${dark ? "border-slate-800" : "border-slate-200"}`}>
        <p className="font-semibold">BiblePath</p>
        <p className="mt-1">Read the Word. Reflect with purpose. Grow in faith.</p>
        <p className="mt-2 text-xs">Personal entries are stored locally in this browser.</p>
      </footer>
    </div>
  );
}