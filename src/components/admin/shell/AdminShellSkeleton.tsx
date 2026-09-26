import { Skeleton } from "@/components/ui/skeleton";
import PageSkeleton from "./PageSkeleton";

/** Mirrors the inset shell (band header included) so the first paint does not jump. */
export default function AdminShellSkeleton() {
  return (
    <div className="flex min-h-svh w-full bg-sidebar">
      <aside className="hidden w-64 shrink-0 flex-col gap-6 p-4 md:flex">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </aside>
      <div
        data-band
        className="flex min-w-0 flex-1 flex-col overflow-x-clip bg-[linear-gradient(to_bottom,hsl(var(--brand-surface))_0,hsl(var(--brand-surface))_14rem,hsl(var(--background))_14rem)] md:m-2 md:ml-0 md:rounded-xl"
      >
        <div className="band-ink flex h-14 items-center gap-3 px-3 md:px-6">
          <Skeleton className="size-6 bg-foreground/10" />
          <Skeleton className="h-4 w-32 bg-foreground/10" />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}
