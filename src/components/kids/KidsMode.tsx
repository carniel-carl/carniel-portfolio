"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import GrownUpCheck from "@/components/kids/GrownUpCheck";
import { Rocket } from "@/components/kids/KidsArt";
import KidsDialog from "@/components/kids/KidsDialog";
import ParentPinSetup from "@/components/kids/ParentPinSetup";
import { isClosedToKids, KIDS_HOME } from "@/lib/audience";
import { getAudience, hasPin, setAudience, useAudience } from "@/lib/audience-client";

/**
 * Site-wide half of kids mode, mounted once in the public layout: keeps
 * <html data-audience> in step with the cookie, turns kids away from closed
 * pages on client-side navigations (the proxy covers full page loads), and
 * shows the "Kids mode" pill that a grown-up can switch off.
 */
export default function KidsMode() {
  const audience = useAudience();
  const pathname = usePathname();
  const router = useRouter();
  // The switch-off dialog: the check, then a PIN offer if the device has none
  const [dialog, setDialog] = useState<"check" | "pin" | null>(null);

  // Read the cookie, not the hook: while hydrating the hook reports null,
  // which would briefly undo the pre-paint attribute
  useEffect(() => {
    const current = getAudience();
    const html = document.documentElement;
    if (current) html.dataset.audience = current;
    else delete html.dataset.audience;
  }, [audience]);

  // A page from the router cache skips the proxy, so check here too
  useEffect(() => {
    if (getAudience() === "kid" && isClosedToKids(pathname)) router.replace(KIDS_HOME);
  }, [audience, pathname, router]);

  if (audience !== "kid") return null;

  const switchOff = () => {
    setAudience("adult");
    setDialog(null);
    toast.success("Kids mode is off");
  };

  return (
    <>
      <div data-kid-only className="fixed bottom-5 left-5 z-[500] md:bottom-6 md:left-6">
        <button
          type="button"
          onClick={() => setDialog("check")}
          aria-haspopup="dialog"
          className="group flex h-14 items-center gap-2.5 rounded-full border border-foreground/10 bg-surface py-1.5 pl-1.5 pr-5 text-left shadow-[0_14px_34px_-16px_hsl(var(--foreground)/0.45)] transition-transform duration-500 ease-expo hover:-translate-y-0.5 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="grid size-11 place-items-center rounded-full bg-[hsl(var(--kid-sun)/0.4)]">
            <Rocket className="size-7 transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-playful text-[0.95rem]">Kids mode</span>
            <span className="text-xs text-foreground/65">Grown-up? Switch off</span>
          </span>
        </button>
      </div>

      {dialog && (
        <KidsDialog
          labelledBy="kids-exit-title"
          describedBy="kids-exit-description"
          // Once the check is passed, only the PIN step's own buttons close it
          onDismiss={dialog === "check" ? () => setDialog(null) : undefined}
        >
          {dialog === "check" ? (
            <GrownUpCheck
              headingId="kids-exit-title"
              descriptionId="kids-exit-description"
              intro="Kids mode keeps the portfolio, contact and author pages closed. Grown-ups can switch it off."
              backLabel="Keep it on"
              onBack={() => setDialog(null)}
              onPass={() => (hasPin() ? switchOff() : setDialog("pin"))}
            />
          ) : (
            <ParentPinSetup
              headingId="kids-exit-title"
              descriptionId="kids-exit-description"
              labels={{ adult: "Switch it off", kid: "Keep kids mode on" }}
              onDone={(next) => (next === "adult" ? switchOff() : setDialog(null))}
            />
          )}
        </KidsDialog>
      )}
    </>
  );
}
