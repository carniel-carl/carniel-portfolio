"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { FocusTrap } from "focus-trap-react";
import { Confetti } from "@/components/kids/KidsArt";
import { cn } from "@/lib/utils";

/**
 * The playground card both kids-mode dialogs sit in. It renders inline (no
 * portal) so the audience prompt is in the server HTML and covers the page
 * from first paint; CSS hides it at once when the session already answered.
 * Without onDismiss it can't be closed: a choice has to be made.
 */
export default function KidsDialog({
  labelledBy,
  describedBy,
  onDismiss,
  active = true,
  leaving = false,
  className,
  children,
  ...rest
}: {
  labelledBy: string;
  describedBy?: string;
  onDismiss?: () => void;
  /** Traps focus and locks scrolling; off while hydrating the server HTML */
  active?: boolean;
  /** Fades the dialog out before it unmounts */
  leaving?: boolean;
  className?: string;
  children: ReactNode;
} & { "data-audience-prompt"?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  // SmoothScroll pauses Lenis and globals.css locks <html> on this attribute
  useEffect(() => {
    const body = document.body;
    if (!active || body.hasAttribute("data-scroll-locked")) return;
    body.setAttribute("data-scroll-locked", "kids");
    return () => {
      if (body.getAttribute("data-scroll-locked") === "kids") body.removeAttribute("data-scroll-locked");
    };
  }, [active]);

  useEffect(() => {
    if (!onDismiss) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <FocusTrap
      active={active}
      focusTrapOptions={{
        escapeDeactivates: false,
        allowOutsideClick: true,
        fallbackFocus: () => cardRef.current!,
      }}
    >
      <motion.div
        initial={false}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: leaving ? 0.3 : 0 }}
        className="fixed inset-0 z-[1000] overflow-y-auto overscroll-contain"
        data-lenis-prevent
        {...rest}
      >
        <div
          aria-hidden="true"
          onClick={onDismiss}
          className="fixed inset-0 bg-background/70 backdrop-blur-md"
          style={{ animation: "kid-fade 0.4s ease-out both" }}
        />
        <div className="pointer-events-none relative grid min-h-full place-items-center px-5 py-12">
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            tabIndex={-1}
            className={cn(
              "pointer-events-auto relative w-full max-w-[33rem] rounded-[2rem] border border-foreground/10 bg-surface p-6 text-foreground shadow-[0_2px_0_hsl(var(--foreground)/0.04),0_40px_90px_-30px_hsl(var(--foreground)/0.5)] outline-none sm:p-9",
              className,
            )}
            style={{ animation: "kid-pop 0.7s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <Confetti />
            <div className="relative">{children}</div>
          </div>
        </div>
      </motion.div>
    </FocusTrap>
  );
}
