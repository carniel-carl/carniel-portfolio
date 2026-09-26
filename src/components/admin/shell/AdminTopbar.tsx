"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getBreadcrumbs } from "@/lib/admin-nav";
import { ChevronRight, ExternalLink, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { useCommandMenu } from "./CommandMenu";
import PinnedHeader from "./PinnedHeader";

const iconButton =
  "size-8 rounded-md text-muted-foreground hover:bg-foreground/[0.07] hover:text-foreground";

export default function AdminTopbar() {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);
  const { setOpen } = useCommandMenu();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <PinnedHeader>
      <SidebarTrigger className={iconButton} />
      <span aria-hidden className="mx-1 h-4 w-px bg-foreground/15" />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          {crumbs.map((crumb, i) => (
            <Fragment key={`${crumb.label}-${i}`}>
              {i > 0 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground/60"
                />
              )}
              <li className="min-w-0 truncate">
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>

      <Button
        variant="ghost"
        size="icon"
        className={iconButton}
        onClick={() => setOpen(true)}
        aria-label="Open command menu"
      >
        <Search />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={iconButton}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Switch theme"
      >
        <Sun className="dark:hidden" />
        <Moon className="hidden dark:block" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`${iconButton} hidden sm:inline-flex`}
        asChild
      >
        <a href="/" target="_blank" rel="noopener" aria-label="View live site">
          <ExternalLink />
        </a>
      </Button>
    </PinnedHeader>
  );
}
