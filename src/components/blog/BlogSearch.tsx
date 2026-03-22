"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getContrastColor } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[];
  category: { name: string; color: string } | null;
}

const STORAGE_KEY = "blog-recent-searches";
const MAX_RECENT = 10;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  const recent = getRecentSearches().filter((s) => s !== term);
  recent.unshift(term);
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  );
}

function clearRecentSearches() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function BlogSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    clearTimeout(timerRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/blog/search?q=${encodeURIComponent(value.trim())}`,
        );
        const data = await res.json();
        setResults(data.results);
      } catch {
        setResults([]);
      }
      setIsLoading(false);
    }, 300);
  }, []);

  const handleSelect = (slug: string) => {
    if (query.trim()) saveRecentSearch(query.trim());
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/blog/${slug}`);
  };

  const handleSearchAll = () => {
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    setOpen(false);
    const q = query.trim();
    setQuery("");
    setResults([]);
    router.push(`/blog?search=${encodeURIComponent(q)}`);
  };

  const handleRecentClick = (term: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/blog?search=${encodeURIComponent(term)}`);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="size-10 rounded-full shadow-lg hover:scale-110 transition-transform"
        // className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg hover:scale-110 transition-transform"
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
        <span className="sr-only">Search blog</span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search blog posts..."
          value={query}
          onValueChange={handleSearch}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              handleSearchAll();
            }
          }}
        />
        <CommandList>
          {query.trim().length >= 2 ? (
            <>
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <CommandEmpty>No results found.</CommandEmpty>
              ) : (
                <CommandGroup heading="Results">
                  {results.map((post) => (
                    <CommandItem
                      key={post.slug}
                      value={post.title}
                      onSelect={() => handleSelect(post.slug)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate flex-1">
                          {post.title}
                        </span>
                        {post.category && (
                          <Badge
                            className="text-[10px] border-0 shrink-0"
                            style={{
                              backgroundColor: post.category.color,
                              color: getContrastColor(post.category.color),
                            }}
                          >
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      {post.excerpt && (
                        <span className="text-xs text-muted-foreground line-clamp-1 pl-6">
                          {post.excerpt}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <div className="px-4 py-2 text-xs text-muted-foreground">
                Press <kbd className="rounded border px-1 py-0.5">↵</kbd> to
                search all &middot;{" "}
                <kbd className="rounded border px-1 py-0.5">ESC</kbd> to close
              </div>
            </>
          ) : (
            <>
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((term) => (
                    <CommandItem
                      key={term}
                      value={term}
                      onSelect={() => handleRecentClick(term)}
                    >
                      <Clock className="size-4 text-muted-foreground" />
                      <span>{term}</span>
                    </CommandItem>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="size-3" />
                    Clear recent searches
                  </button>
                </CommandGroup>
              )}
              {recentSearches.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground/50">
                  Type to search blog posts...
                </div>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
