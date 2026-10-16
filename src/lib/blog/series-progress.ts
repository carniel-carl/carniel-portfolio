"use client";

// Per-reader series progress, kept in this browser only: which episodes were
// read to the end and which one was opened last ("Continue" targets), plus
// when the reader was last in the series and whether they took it off the
// blog's "Continue reading" shelf.
// Storage can be blocked (private mode, previews), so every access is guarded
// and progress falls back to memory for the session.
import { useMemo, useSyncExternalStore } from "react";

const KEY = "blog-series-progress:v1";

type Entry = { read: string[]; last?: string; at?: number; hidden?: boolean };
type Store = Record<string, Entry>;
export type SeriesProgressEntry = Entry;

const listeners = new Set<() => void>();
const EMPTY: Store = {};
let raw: string | null = null;
let parsed: Store = EMPTY;

function snapshot(): Store {
  let next: string | null;
  try {
    next = localStorage.getItem(KEY);
  } catch {
    return parsed;
  }
  if (next !== raw) {
    raw = next;
    try {
      const value = next ? JSON.parse(next) : EMPTY;
      parsed = value && typeof value === "object" ? value : EMPTY;
    } catch {
      parsed = EMPTY;
    }
  }
  return parsed;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Other tabs
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function update(seriesSlug: string, change: (entry: Entry) => Entry) {
  const store = snapshot();
  const next = { ...store, [seriesSlug]: change(store[seriesSlug] ?? { read: [] }) };
  raw = JSON.stringify(next);
  parsed = next;
  try {
    localStorage.setItem(KEY, raw);
  } catch {
    // Memory only for this session
  }
  listeners.forEach((l) => l());
}

// Opening or finishing an episode puts the series back on the shelf
export function markEpisodeOpened(seriesSlug: string, postSlug: string) {
  update(seriesSlug, ({ hidden: _, ...e }) => ({ ...e, last: postSlug, at: Date.now() }));
}

export function markEpisodeRead(seriesSlug: string, postSlug: string) {
  if (snapshot()[seriesSlug]?.read.includes(postSlug)) return;
  update(seriesSlug, ({ hidden: _, ...e }) => ({ ...e, read: [...e.read, postSlug], at: Date.now() }));
}

/** Takes a series off "Continue reading" until one of its episodes is opened again */
export function hideFromShelf(seriesSlug: string) {
  update(seriesSlug, (e) => ({ ...e, hidden: true }));
}

export function resetSeriesProgress(seriesSlug: string) {
  update(seriesSlug, () => ({ read: [] }));
}

/** Every series' progress, live across tabs; `ready` as below */
export function useAllSeriesProgress() {
  const store = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return { store, ready };
}

/** Where a reader is in one series, from its stored entry */
export function progressFor(entry: Entry | undefined, episodeSlugs: string[]) {
  // Only count episodes that still exist and are published
  const read = new Set((entry?.read ?? []).filter((s) => episodeSlugs.includes(s)));
  const firstUnread = episodeSlugs.find((s) => !read.has(s)) ?? null;
  const last = entry?.last && episodeSlugs.includes(entry.last) ? entry.last : null;
  return {
    read,
    readCount: read.size,
    started: read.size > 0 || last !== null,
    finished: episodeSlugs.length > 0 && read.size === episodeSlugs.length,
    // Resume where they stopped: the last opened episode if unfinished, else the next unread
    resume: last && !read.has(last) ? last : firstUnread,
  };
}

/**
 * Progress for one series. `ready` is false during SSR and the first client
 * render, so callers can avoid flashing "Start" before "Continue".
 */
export function useSeriesProgress(seriesSlug: string, episodeSlugs: string[]) {
  const store = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const entry = store[seriesSlug];
  const key = episodeSlugs.join("|");

  return useMemo(() => {
    return { ready, ...progressFor(entry, episodeSlugs) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, key, ready]);
}
