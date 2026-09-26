import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type AdminPageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  /** Parent route. Rendered as a back link above the title. */
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
};

export default function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {backHref && (
          <Link
            href={backHref}
            className="group -ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5 transition-transform duration-300 ease-expo group-hover:-translate-x-0.5" />
            {backLabel}
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-[65ch] text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
