import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Logo from "./general/Logo";
import ThemeSwitch from "./general/ThemeSwitcher";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header
      className={cn(
        "flex shrink-0 fixed w-full top-0 right-0  bg-sidebar z-50 items-center gap-2 border-b transition-[width,height] ease-linear py-2",
        "bg-sidebar/80 backdrop-blur md:w-[var(--dashboard-header-width)]",
      )}
    >
      <div className="flex w-full items-center gap-1 px-2 lg:gap-2 lg:px-6">
        <div className="flex-1 flex items-center gap-2">
          <div className="md:hidden">
            <Logo size="1.5rem" />
          </div>
          {children}
        </div>
        <ThemeSwitch />
        <SidebarTrigger className="md:hidden" />
      </div>
    </header>
  );
}
