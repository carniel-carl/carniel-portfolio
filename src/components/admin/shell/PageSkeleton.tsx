import { Skeleton } from "@/components/ui/skeleton";

/** Generic page shape: band header, overlapping tile row, content block. */
export default function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-8">
      <div data-slot="page-header" className="space-y-2">
        <Skeleton className="h-8 w-52 bg-foreground/10" />
        <Skeleton className="h-4 w-72 bg-foreground/10" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface h-[108px] p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-5 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="surface space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
