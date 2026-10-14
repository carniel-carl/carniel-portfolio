import { pageList } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** URL of a page, keeping the list's filters */
  href: (page: number) => string;
  /** Plural noun for the range label, e.g. "posts" */
  noun: string;
  className?: string;
};

const step =
  "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/** Range label plus page links. Renders the label alone when everything fits on one page. */
export default function Pagination({ page, pageSize, total, href, noun, className }: PaginationProps) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}>
      <p className="tnum text-xs text-muted-foreground">
        {totalPages > 1 ? `${from}–${to} of ${total} ${noun}` : `${total} ${noun}`}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} aria-label="Previous page" className={step}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "pointer-events-none opacity-40")}>
              <ChevronLeft className="size-4" />
            </span>
          )}
          {pageList(page, totalPages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-xs text-muted-foreground">
                &hellip;
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  step,
                  "tnum w-auto min-w-8 px-2 font-mono text-xs",
                  p === page && "bg-card font-medium text-foreground shadow-sm ring-1 ring-border hover:bg-card",
                )}
              >
                {p}
              </Link>
            ),
          )}
          {page < totalPages ? (
            <Link href={href(page + 1)} aria-label="Next page" className={step}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={cn(step, "pointer-events-none opacity-40")}>
              <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
