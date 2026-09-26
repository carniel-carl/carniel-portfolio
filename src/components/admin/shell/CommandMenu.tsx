"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  adminNavGroups,
  categoriesNavItem,
} from "@/lib/admin-nav";
import routes from "@/lib/routes";
import {
  ExternalLink,
  FilePlus2,
  FolderPlus,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CommandMenuContextValue = { open: boolean; setOpen: (open: boolean) => void };

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) throw new Error("useCommandMenu must be used inside CommandMenuProvider");
  return ctx;
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <CommandMenuContext.Provider value={value}>
      {children}
      <CommandMenuDialog open={open} setOpen={setOpen} />
    </CommandMenuContext.Provider>
  );
}

function CommandMenuDialog({ open, setOpen }: CommandMenuContextValue) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [setOpen],
  );

  const itemClass =
    "gap-3 rounded-md px-2.5 py-2.5 data-[selected=true]:bg-muted data-[selected=true]:text-foreground";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg [&>button]:hidden">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command className="bg-popover [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-input]]:h-12">
          <CommandInput placeholder="Jump to a page or run an action" />
          <CommandList className="max-h-[min(60vh,380px)] p-1.5">
            <CommandEmpty>Nothing matches that search.</CommandEmpty>

            <CommandGroup heading="Create">
              <CommandItem
                className={itemClass}
                onSelect={() => run(() => router.push(routes.admin.blogNew))}
                keywords={["write", "post", "article"]}
              >
                <FilePlus2 className="text-muted-foreground" />
                New blog post
              </CommandItem>
              <CommandItem
                className={itemClass}
                onSelect={() => run(() => router.push(routes.admin.projectNew))}
                keywords={["add", "work"]}
              >
                <FolderPlus className="text-muted-foreground" />
                New project
              </CommandItem>
            </CommandGroup>

            {adminNavGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    className={itemClass}
                    keywords={item.keywords}
                    onSelect={() => run(() => router.push(item.href))}
                  >
                    <item.icon className="text-muted-foreground" />
                    {item.label}
                  </CommandItem>
                ))}
                {group.label === "Content" && (
                  <CommandItem
                    className={itemClass}
                    keywords={["tags", "labels"]}
                    onSelect={() => run(() => router.push(categoriesNavItem.href))}
                  >
                    <categoriesNavItem.icon className="text-muted-foreground" />
                    {categoriesNavItem.label}
                  </CommandItem>
                )}
              </CommandGroup>
            ))}

            <CommandSeparator className="my-1" />

            <CommandGroup heading="General">
              <CommandItem
                className={itemClass}
                keywords={["dark", "light", "mode"]}
                onSelect={() =>
                  run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))
                }
              >
                <Sun className="text-muted-foreground dark:hidden" />
                <Moon className="hidden text-muted-foreground dark:block" />
                Switch theme
              </CommandItem>
              <CommandItem
                className={itemClass}
                keywords={["preview", "open", "public"]}
                onSelect={() => run(() => window.open("/", "_blank", "noopener"))}
              >
                <ExternalLink className="text-muted-foreground" />
                View live site
              </CommandItem>
              <CommandItem
                className={itemClass}
                keywords={["logout", "exit"]}
                onSelect={() => run(() => signOut({ callbackUrl: routes.admin.login }))}
              >
                <LogOut className="text-muted-foreground" />
                Sign out
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <div className="flex items-center justify-end gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd> select
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd> close
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
