import { adminZ } from "@/lib/admin-z";
import { cn } from "@/lib/utils";

/**
 * Fixed (not sticky) header that tracks the inset sheet. Sticky inside the
 * scrolling sheet drags and bounces; fixed does not, so it reads its left
 * edge and width from vars published by SidebarProvider.
 */
export default function PinnedHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      {/* Reserves the header's height in the flow */}
      <div aria-hidden className="h-14 shrink-0" />
      <div
        className={cn(
          // bg-sidebar covers the inset's top gap so scrolled content never shows through
          "fixed left-0 top-0 w-full bg-sidebar md:pt-2",
          "md:left-[--dashboard-header-left] md:w-[--dashboard-header-width] md:transition-[left,width] md:duration-200 md:ease-linear",
          adminZ.header,
        )}
      >
        <header
          className={cn(
            "band-ink flex h-14 items-center gap-2 bg-[hsl(var(--brand-surface))] px-3 md:rounded-t-xl md:px-6",
            className,
          )}
        >
          {children}
        </header>
      </div>
    </>
  );
}
