"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useLenis } from "lenis/react";
import {
  ArrowRight,
  Clock,
  CornerDownLeft,
  FileText,
  Hash,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/mixpanel";

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  tags: string[];
  category: { name: string; color: string } | null;
}

type Suggestions = { posts: SearchResult[]; tags: string[] };

const STORAGE_KEY = "blog-recent-searches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== term);
    recent.unshift(term);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Wraps every query word found in `text` in an accent <mark>
function highlight(text: string, query: string): ReactNode {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      // --clr is a plain hex var, so Tailwind's "/25" opacity can't apply to it;
      // mix it in CSS instead (and override the browser's default yellow <mark>)
      <mark
        key={i}
        className="rounded-[3px] bg-[color-mix(in_srgb,var(--clr)_30%,transparent)] px-0.5 font-semibold text-foreground"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const formatDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

// Shared row for results and suggested posts
function PostRow({ post, query, onSelect }: { post: SearchResult; query: string; onSelect: () => void }) {
  return (
    <Command.Item
      value={`post:${post.slug}`}
      onSelect={onSelect}
      className="group relative flex cursor-pointer items-center gap-3.5 rounded-xl p-2 outline-none transition-colors data-[selected=true]:bg-foreground/[0.06]"
    >
      <span className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-accent opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
      <span className="relative ml-1.5 aspect-[16/10] w-16 shrink-0 overflow-hidden rounded-lg bg-foreground/[0.06]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-foreground/35">
            <FileText className="size-4" />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">
          {highlight(post.title, query)}
        </span>
        {post.excerpt && (
          <span className="truncate text-xs text-foreground/60">{highlight(post.excerpt, query)}</span>
        )}
        <span className="mt-0.5 flex items-center gap-2 text-[0.7rem] text-foreground/50">
          {post.category && (
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: post.category.color }} />
              {post.category.name}
            </span>
          )}
          {formatDate(post.publishedAt)}
        </span>
      </span>
      <ArrowRight className="mr-1 size-4 shrink-0 text-foreground/35 opacity-0 transition-[opacity,transform] group-data-[selected=true]:translate-x-0.5 group-data-[selected=true]:opacity-100" />
    </Command.Item>
  );
}

const groupHeading =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[0.7rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-foreground/45";

export default function BlogSearch() {
  const router = useRouter();
  const lenis = useLenis();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isMac, setIsMac] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflight = useRef<AbortController | null>(null);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Pause smooth scrolling behind the dialog; load suggestions once
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    setRecent(getRecentSearches());
    if (!suggestions) {
      fetch("/api/blog/search?suggest=1")
        .then((r) => r.json())
        .then(setSuggestions)
        .catch(() => {});
    }
    return () => {
      lenis?.start();
    };
  }, [open, lenis, suggestions]);

  const runSearch = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(timer.current);
    inflight.current?.abort();
    if (value.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timer.current = setTimeout(async () => {
      // Cancel the previous request so a slow response can't overwrite a newer one
      const controller = new AbortController();
      inflight.current = controller;
      try {
        const res = await fetch(`/api/blog/search?q=${encodeURIComponent(value.trim())}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setStatus("done");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setStatus("error");
      }
    }, 220);
  }, []);

  const reset = () => {
    setQuery("");
    setResults([]);
    setStatus("idle");
  };

  const openPost = (slug: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    trackEvent("Blog Search Result Opened", { query: query.trim() || undefined, slug });
    setOpen(false);
    reset();
    router.push(`/blog/${slug}`);
  };

  const searchAll = (term = query.trim()) => {
    if (!term) return;
    saveRecentSearch(term);
    setOpen(false);
    reset();
    router.push(`/blog?search=${encodeURIComponent(term)}`);
  };

  const openTag = (tag: string) => {
    setOpen(false);
    reset();
    router.push(`/blog?tag=${encodeURIComponent(tag)}`);
  };

  const hasQuery = query.trim().length >= 2;
  const kbd = "grid h-6 min-w-6 place-items-center rounded-md border border-foreground/15 bg-foreground/[0.04] px-1.5 font-mono text-[0.68rem] text-foreground/60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search articles"
        className="group flex h-12 w-full items-center gap-3 rounded-full border border-foreground/15 bg-foreground/[0.03] pl-4 pr-2 text-left text-foreground/60 transition-colors hover:border-foreground/35 hover:text-foreground active:scale-[0.99] md:w-72"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-sm">Search articles</span>
        <kbd className="hidden h-8 items-center rounded-full border border-foreground/15 px-2.5 font-mono text-[0.7rem] text-foreground/60 sm:flex">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <DialogPrimitive.Root
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[130] bg-background/55 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-[8vh] z-[131] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-background/90 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_40px_100px_-30px_hsl(var(--foreground)/0.5)] backdrop-blur-2xl duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=open]:slide-in-from-top-2 md:top-[12vh]"
          >
            <DialogPrimitive.Title className="sr-only">Search articles</DialogPrimitive.Title>
            {/* Server already filtered; cmdk re-filtering by title would hide body/tag matches */}
            <Command shouldFilter={false} loop label="Search articles">
              <div className="flex items-center gap-3 border-b border-foreground/10 px-5">
                <Search className="size-5 shrink-0 text-foreground/45" aria-hidden="true" />
                <Command.Input
                  value={query}
                  onValueChange={runSearch}
                  placeholder="Search posts, topics, tags..."
                  onKeyDown={(e) => {
                    // Enter with nothing highlighted runs a full search
                    if (e.key === "Enter" && hasQuery && status === "done" && results.length === 0) {
                      e.preventDefault();
                      searchAll();
                    }
                  }}
                  className="h-16 w-full bg-transparent text-base text-foreground outline-none placeholder:text-foreground/45 md:text-lg"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="Clear search"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <DialogPrimitive.Close className={cn(kbd, "shrink-0 px-2")}>esc</DialogPrimitive.Close>
                )}
              </div>

              <Command.List
                data-lenis-prevent
                className={cn("max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2", groupHeading)}
              >
                {hasQuery ? (
                  <>
                    {status === "loading" && (
                      <Command.Loading>
                        <div className="flex flex-col gap-1 p-1" aria-label="Searching">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3.5 p-2">
                              <span className="ml-1.5 aspect-[16/10] w-16 animate-pulse rounded-lg bg-foreground/10" />
                              <span className="flex flex-1 flex-col gap-2">
                                <span className="h-3 w-3/4 animate-pulse rounded bg-foreground/10" />
                                <span className="h-2.5 w-1/2 animate-pulse rounded bg-foreground/[0.07]" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </Command.Loading>
                    )}

                    {status === "error" && (
                      <p className="px-4 py-10 text-center text-sm text-foreground/60">
                        Search is unavailable right now. Try again in a moment.
                      </p>
                    )}

                    {status === "done" && results.length === 0 && (
                      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-foreground/[0.06] text-foreground/50">
                          <SearchX className="size-5" />
                        </span>
                        <p className="font-medium">No posts match &ldquo;{query.trim()}&rdquo;</p>
                        {suggestions?.tags.length ? (
                          <div className="flex flex-wrap justify-center gap-1.5">
                            <span className="w-full text-xs text-foreground/55">Try a topic instead</span>
                            {suggestions.tags.slice(0, 5).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => openTag(tag)}
                                className="rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {status === "done" && results.length > 0 && (
                      <>
                        <Command.Group heading={`${results.length} ${results.length === 1 ? "result" : "results"}`}>
                          {results.map((post) => (
                            <PostRow key={post.slug} post={post} query={query} onSelect={() => openPost(post.slug)} />
                          ))}
                        </Command.Group>
                        <Command.Item
                          value="search-all"
                          onSelect={() => searchAll()}
                          className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-foreground/70 outline-none data-[selected=true]:bg-foreground/[0.06] data-[selected=true]:text-foreground"
                        >
                          <Search className="size-4" />
                          <span className="flex-1">
                            See all results for <span className="font-medium text-foreground">&ldquo;{query.trim()}&rdquo;</span>
                          </span>
                          <CornerDownLeft className="size-4 opacity-60" />
                        </Command.Item>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {recent.length > 0 && (
                      <Command.Group heading="Recent">
                        {recent.map((term) => (
                          <Command.Item
                            key={term}
                            value={`recent:${term}`}
                            onSelect={() => searchAll(term)}
                            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/75 outline-none data-[selected=true]:bg-foreground/[0.06] data-[selected=true]:text-foreground"
                          >
                            <Clock className="size-4 text-foreground/45" />
                            <span className="flex-1 truncate">{term}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {suggestions?.tags.length ? (
                      <div className="px-3 pb-2 pt-3">
                        <p className="pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-foreground/45">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestions.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => openTag(tag)}
                              className="flex items-center gap-1 rounded-full border border-foreground/15 px-2.5 py-1 text-xs text-foreground/75 transition-colors hover:border-foreground/40 hover:text-foreground"
                            >
                              <Hash className="size-3 text-accent-ink dark:text-accent" />
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {suggestions?.posts.length ? (
                      <Command.Group heading="Latest posts">
                        {suggestions.posts.map((post) => (
                          <PostRow key={post.slug} post={post} query="" onSelect={() => openPost(post.slug)} />
                        ))}
                      </Command.Group>
                    ) : (
                      !suggestions && (
                        <p className="px-4 py-10 text-center text-sm text-foreground/50">
                          Start typing to search every post.
                        </p>
                      )
                    )}
                  </>
                )}
              </Command.List>

              {/* Keyboard hints */}
              <div className="hidden items-center gap-5 border-t border-foreground/10 px-5 py-3 text-xs text-foreground/55 sm:flex">
                <span className="flex items-center gap-1.5">
                  <span className={kbd}>&uarr;</span>
                  <span className={kbd}>&darr;</span>
                  to navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={kbd}>
                    <CornerDownLeft className="size-3" />
                  </span>
                  to open
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={kbd}>esc</span>
                  to close
                </span>
              </div>
            </Command>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
