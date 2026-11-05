"use client";

import EmptyState from "@/components/admin/ui/EmptyState";
import SearchField from "@/components/admin/ui/SearchField";
import StatusPill from "@/components/admin/ui/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchStandalonePosts } from "@/lib/actions/series";
import { Loader2, SearchX } from "lucide-react";
import { useEffect, useState } from "react";

type Result = Awaited<ReturnType<typeof searchStandalonePosts>>[number];

/**
 * Finds a post that is not in any series by searching on the server, so the
 * page never has to load every standalone post up front.
 */
export default function AddExistingPostDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolves true when the post was added; the dialog stays open otherwise */
  onAdd: (postId: string) => Promise<boolean>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let stale = false;
    // The newest posts show right away; typing waits for a pause
    const timer = setTimeout(
      async () => {
        try {
          const rows = await searchStandalonePosts(query);
          if (!stale) setResults(rows);
        } catch {
          if (!stale) setResults([]);
        }
      },
      query ? 250 : 0,
    );
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [open, query]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setResults(null);
  };

  const add = async (id: string) => {
    setAdding(id);
    try {
      if (await onAdd(id)) close();
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (adding) return;
        if (o) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display tracking-tight">Add existing post</DialogTitle>
          <DialogDescription>Posts that are not in a series yet. It is added as the last episode.</DialogDescription>
        </DialogHeader>
        <SearchField value={query} onChange={setQuery} placeholder="Search post titles" autoFocus />
        <div className="-mx-2 max-h-80 min-h-32 overflow-y-auto">
          {results === null ? (
            <div className="grid h-32 place-items-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-label="Loading posts" />
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={query ? `No posts match "${query}"` : "No posts outside a series"}
              description={query ? "Only posts not already in a series show here." : "Every post already belongs to a series."}
              className="border-0"
            />
          ) : (
            <ul className="space-y-0.5">
              {results.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    disabled={!!adding}
                    onClick={() => add(post.id)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{post.title}</span>
                    {adding === post.id ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <StatusPill published={post.published} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {results && results.length === 10 && (
          <p className="text-xs text-muted-foreground">Showing the 10 newest matches. Type more of the title to narrow it down.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
