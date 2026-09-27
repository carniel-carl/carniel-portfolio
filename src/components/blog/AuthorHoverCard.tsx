"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { ArrowUpRight, Home } from "lucide-react";
import { trackEvent } from "@/lib/mixpanel";
import routes from "@/lib/routes";

// Author name in the post header. Hover/focus (tap on touch) reveals a small
// profile card that leads readers who landed straight on a post into the site.
export default function AuthorHoverCard({
  name,
  photo,
}: {
  name: string;
  photo: string;
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context, placement } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(10), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: { open: 120, close: 150 },
    // Keep it open while the pointer travels from the name into the card
    handleClose: safePolygon({ buffer: 2 }),
    mouseOnly: true,
  });
  const focus = useFocus(context);
  const click = useClick(context, { ignoreMouse: true });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "dialog" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  const track = (target: string) =>
    trackEvent("Author Card Clicked", { target, source_page: "blog_post" });

  const fromTop = placement.startsWith("bottom");

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        {...getReferenceProps()}
        className="group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 font-medium text-foreground/85 outline-none transition-colors hover:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="relative size-7 overflow-hidden rounded-full bg-surface">
          <Image src={photo} alt="" fill sizes="28px" className="object-cover" />
        </span>
        <span className="underline decoration-foreground/25 decoration-dotted underline-offset-4 transition-colors group-hover:decoration-foreground/60">
          {name}
        </span>
      </button>

      <FloatingPortal>
        <AnimatePresence>
          {open && (
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-[120]"
              {...getFloatingProps()}
            >
              <motion.div
                initial={{ opacity: 0, y: fromTop ? -6 : 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: fromTop ? -4 : 4, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="w-[19rem] overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-background/90 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_30px_70px_-25px_hsl(var(--foreground)/0.45)] backdrop-blur-2xl"
              >
                <div className="flex items-center gap-3.5 p-4 pb-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-surface">
                    <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold tracking-[-0.02em]">
                      {name}
                    </p>
                    <p className="text-sm text-foreground/60">Web &amp; mobile developer</p>
                  </div>
                </div>
                <p className="px-4 pb-4 text-sm leading-relaxed text-foreground/70">
                  I build fast, accessible web and mobile apps with React,
                  Next.js and React Native.
                </p>
                <div className="grid grid-cols-2 gap-2 border-t border-foreground/10 p-3">
                  <Link
                    href={routes.public.home}
                    onClick={() => track("home")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent text-sm font-medium text-accent-on transition-transform active:scale-[0.97]"
                  >
                    <Home className="size-4" aria-hidden="true" />
                    Visit site
                  </Link>
                  <Link
                    href={routes.public.portfolio}
                    onClick={() => track("portfolio")}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-foreground/15 text-sm font-medium transition-colors hover:border-foreground/40 active:scale-[0.97]"
                  >
                    Portfolio
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  );
}
