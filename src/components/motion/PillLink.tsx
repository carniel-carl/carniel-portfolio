import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "solid" | "ghost";

const base =
  "group relative inline-flex h-12 items-center gap-3 whitespace-nowrap rounded-full pl-6 pr-2 text-[0.95rem] font-medium transition-[transform,background-color,color] duration-500 ease-expo active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60";

const variants: Record<Variant, string> = {
  solid: "bg-accent text-accent-on",
  ghost:
    "border border-foreground/20 text-foreground hover:border-foreground/60",
};

const iconWrap: Record<Variant, string> = {
  solid: "bg-accent-on text-accent",
  ghost: "bg-foreground text-background",
};

// Label rolls vertically on hover: the duplicate slides in from below.
export const RollingLabel = ({ children }: { children: ReactNode }) => (
  <span className="relative block overflow-hidden">
    <span className="block transition-transform duration-500 ease-expo group-hover:-translate-y-full">
      {children}
    </span>
    <span
      aria-hidden="true"
      className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-expo group-hover:translate-y-0"
    >
      {children}
    </span>
  </span>
);

export const pillClasses = (variant: Variant = "solid", className?: string) =>
  cn(base, variants[variant], className);

export const PillIcon = ({
  children,
  variant = "solid",
}: {
  children: ReactNode;
  variant?: Variant;
}) => (
  <span
    className={cn(
      "grid size-8 place-items-center rounded-full transition-transform duration-500 ease-expo group-hover:rotate-[-45deg] [&_svg]:size-4",
      iconWrap[variant],
    )}
  >
    {children}
  </span>
);

type PillLinkProps = {
  href: string;
  variant?: Variant;
  icon: ReactNode;
  children: ReactNode;
  external?: boolean;
} & Omit<ComponentPropsWithoutRef<"a">, "href">;

const PillLink = ({
  href,
  variant = "solid",
  icon,
  children,
  className,
  external,
  ...rest
}: PillLinkProps) => {
  const inner = (
    <>
      <RollingLabel>{children}</RollingLabel>
      <PillIcon variant={variant}>{icon}</PillIcon>
    </>
  );

  // File downloads: plain same-tab <a> (next/link would prefetch/navigate)
  if (rest.download !== undefined) {
    return (
      <a href={href} className={pillClasses(variant, className)} {...rest}>
        {inner}
      </a>
    );
  }

  if (external || href.startsWith("http") || href.endsWith(".pdf")) {
    return (
      <a
        href={href}
        className={pillClasses(variant, className)}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={pillClasses(variant, className)} {...rest}>
      {inner}
    </Link>
  );
};

export default PillLink;
