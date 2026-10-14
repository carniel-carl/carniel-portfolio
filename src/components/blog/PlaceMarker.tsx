"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { useLenis } from "lenis/react";
import { ArrowDown, BookmarkPlus, Check, X } from "lucide-react";
import { useIntroDone } from "@/components/layout/Intro";
import { trackEvent } from "@/lib/mixpanel";
import { cn } from "@/lib/utils";
import {
  clearMark,
  describeRange,
  getMark,
  hintSeen,
  lineBoxes,
  resolveMark,
  saveMark,
  setHintSeen,
  wordRangeAtPoint,
  wordRangeAtReadingLine,
  type Line,
  type PlaceMark,
} from "@/lib/blog/place-marks";

// Taps on these keep their own meaning; they never start a mark
const INTERACTIVE = "a, button, input, textarea, select, label, summary, pre, img, video, iframe, [data-place-skip]";
// Below the fixed header: where "the line you're reading" sits for the M key
const READING_LINE = 96;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Draft = { id: number; mark: PlaceMark; kind: "word" | "passage"; keyboard: boolean };

/**
 * "You stopped here" for blog posts. Tap a word (or select a passage) and
 * confirm, and a highlighter stroke and a margin ribbon keep the place in this
 * browser. Next visit the mark is already there, and a pill offers to jump
 * back to it. M marks the line being read, so it works from the keyboard too.
 */
export default function PlaceMarker({ slug, children }: { slug: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const lenis = useLenis();
  const coarse = useCoarsePointer();

  const wrap = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const ribbon = useRef<HTMLButtonElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const pointer = useRef<{ x: number; y: number; type: string } | null>(null);
  const pending = useRef<number | undefined>(undefined);
  const closing = useRef<number | undefined>(undefined);
  const keyboardOpen = useRef(false);

  // The saved mark
  const [mark, setMark] = useState<PlaceMark | null>(null);
  const [exact, setExact] = useState(true);
  const [restored, setRestored] = useState(false);
  const markRange = useRef<Range | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  // Bumped to replay the highlighter stroke (0 = draw it static)
  const [stroke, setStroke] = useState(0);

  // A word or passage waiting on "Mark my place"
  const [draft, setDraft] = useState<Draft | null>(null);
  const draftRange = useRef<Range | null>(null);
  const [draftLines, setDraftLines] = useState<Line[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [menu, setMenu] = useState(false);

  const [below, setBelow] = useState(false);
  const [reached, setReached] = useState(false);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [label, setLabel] = useState(false);
  const [hover, setHover] = useState(false);
  const [hint, setHint] = useState(false);
  const [announce, setAnnounce] = useState("");

  // HDR: GEOMETRY
  const measure = useCallback(() => {
    const w = wrap.current;
    const r = root.current;
    if (!w || !r) return;
    const origin = w.getBoundingClientRect();
    setLines(markRange.current ? lineBoxes(r, markRange.current, origin) : []);
    setDraftLines(draftRange.current ? lineBoxes(r, draftRange.current, origin) : []);
  }, []);

  useLayoutEffect(measure, [mark, draft, measure]);

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    // Images loading and late fonts reflow the text under a mark
    const observer = new ResizeObserver(() => measure());
    observer.observe(w);
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // HDR: RESTORE
  useEffect(() => {
    const saved = getMark(slug);
    if (!saved || !root.current) return;
    const found = resolveMark(root.current, saved);
    if (!found) return;
    markRange.current = found.range;
    setMark(saved);
    setExact(found.exact);
    setRestored(true);
  }, [slug]);

  const hasMark = lines.length > 0;

  // Where the mark is relative to the viewport
  useEffect(() => {
    const el = ribbon.current;
    if (!el || !hasMark) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const bounds = entry.rootBounds;
        setBelow(!entry.isIntersecting && !!bounds && entry.boundingClientRect.top > bounds.bottom);
        if (entry.isIntersecting) setReached(true);
      },
      { rootMargin: "-72px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMark, mark]);

  // A mark from an earlier visit introduces itself the first time it's seen
  useEffect(() => {
    if (!restored || !reached) return;
    setLabel(true);
    const t = window.setTimeout(() => setLabel(false), 4500);
    return () => window.clearTimeout(t);
  }, [restored, reached]);

  // HDR: DRAFTS
  const closeDraft = useCallback(() => {
    window.clearTimeout(closing.current);
    draftRange.current = null;
    if (keyboardOpen.current) returnFocus.current?.focus({ preventScroll: true });
    keyboardOpen.current = false;
    setDraft(null);
    setConfirmed(false);
    setMenu(false);
  }, []);

  const startDraft = useCallback(
    (range: Range, kind: Draft["kind"], keyboard: boolean) => {
      const r = root.current;
      if (!r) return;
      const described = describeRange(r, range);
      if (!described) return;
      window.clearTimeout(closing.current);
      // The trimmed range, so the preview hugs the words
      draftRange.current = resolveMark(r, described)?.range ?? range;
      keyboardOpen.current = keyboard;
      setConfirmed(false);
      setMenu(false);
      setDraft({ id: Date.now(), mark: described, kind, keyboard });
    },
    [],
  );

  const confirm = () => {
    if (!draft || !draftRange.current) return;
    const fresh = { ...draft.mark, savedAt: Date.now() };
    saveMark(slug, fresh);
    trackEvent("Blog Place Marked", { slug, kind: draft.kind, moved: Boolean(mark) });
    markRange.current = draftRange.current;
    setMark(fresh);
    setExact(true);
    setRestored(false);
    setResumeDismissed(true);
    setStroke((s) => s + 1);
    setConfirmed(true);
    setHint(false);
    setHintSeen();
    setAnnounce("Place marked. It will be here when you come back to this post.");
    window.getSelection()?.removeAllRanges();
    closing.current = window.setTimeout(() => {
      draftRange.current = null;
      setDraft(null);
      setConfirmed(false);
      if (keyboardOpen.current) ribbon.current?.focus({ preventScroll: true });
      keyboardOpen.current = false;
    }, 1400);
  };

  const remove = () => {
    clearMark(slug);
    trackEvent("Blog Place Cleared", { slug });
    markRange.current = null;
    keyboardOpen.current = false;
    setMark(null);
    setMenu(false);
    setLabel(false);
    setAnnounce("Mark removed.");
  };

  // HDR: POINTER
  const onPointerDown = (e: PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, type: e.pointerType };
  };

  const onClick = (e: MouseEvent) => {
    window.clearTimeout(pending.current);
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Double and triple clicks select text; the mouseup path takes those
    if (e.detail > 1) return;
    if ((e.target as Element).closest(INTERACTIVE)) return;
    const p = pointer.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6) return;
    if (!window.getSelection()?.isCollapsed) return;
    const r = root.current;
    if (!r) return;
    // Read the word now: smooth scrolling may still move the page
    const range = wordRangeAtPoint(r, e.clientX, e.clientY);
    const open = () => {
      if (!range) return closeDraft();
      if (overlaps(range, markRange.current)) {
        draftRange.current = null;
        setDraft(null);
        setMenu(true);
        return;
      }
      startDraft(range, "word", false);
    };
    // A short wait on a mouse so a double-click doesn't flash the popover
    if (p?.type === "mouse") pending.current = window.setTimeout(open, 220);
    else open();
  };

  const onMouseUp = () => {
    if (pointer.current?.type !== "mouse") return;
    requestAnimationFrame(() => {
      const sel = window.getSelection();
      const r = root.current;
      if (!sel || sel.isCollapsed || !sel.rangeCount || !r) return;
      const range = sel.getRangeAt(0);
      if (!r.contains(range.commonAncestorContainer)) return;
      const text = sel.toString().trim();
      if (!text || text.length > 600) return;
      startDraft(range.cloneRange(), /\s/.test(text) ? "passage" : "word", false);
    });
  };

  // HDR: KEYBOARD (M marks the line you're reading)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']")) return;
      // A menu, search or the kids prompt is open over the page
      if (document.body.hasAttribute("data-scroll-locked") || document.body.classList.contains("no-scroll")) return;
      if (document.querySelector("[data-audience-prompt]")) return;
      const r = root.current;
      if (!r) return;
      const box = r.getBoundingClientRect();
      if (box.bottom < READING_LINE || box.top > window.innerHeight * 0.6) return;
      const range = wordRangeAtReadingLine(r, Math.max(READING_LINE, box.top));
      if (!range) return;
      e.preventDefault();
      returnFocus.current = document.activeElement as HTMLElement | null;
      if (overlaps(range, markRange.current)) {
        keyboardOpen.current = true;
        setMenu(true);
        return;
      }
      startDraft(range, "word", true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [startDraft]);

  // HDR: POPOVER
  const popOpen = Boolean(draft) || menu;
  const pop = useFloating({
    open: popOpen,
    onOpenChange: (open) => !open && closeDraft(),
    placement: "top",
    strategy: "fixed",
    middleware: [offset(12), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const dismiss = useDismiss(pop.context, {
    // The ribbon toggles the menu itself
    outsidePress: (e) => !ribbon.current?.contains(e.target as Node),
    escapeKey: true,
  });
  const { getFloatingProps } = useInteractions([dismiss]);

  const setPositionReference = pop.refs.setPositionReference;
  useLayoutEffect(() => {
    const range = menu ? markRange.current : draftRange.current;
    if (!range) return;
    // Anchor to the first line, so a long passage keeps the popover close
    setPositionReference({
      getBoundingClientRect: () => range.getClientRects()[0] ?? range.getBoundingClientRect(),
      getClientRects: () => range.getClientRects(),
    });
  }, [draft, menu, setPositionReference]);

  // Keyboard opens move focus in; a tap leaves the reader where they are
  useEffect(() => {
    if (draft?.keyboard && !confirmed) primary.current?.focus({ preventScroll: true });
  }, [draft, confirmed]);

  useEffect(() => {
    if (menu && keyboardOpen.current) primary.current?.focus({ preventScroll: true });
  }, [menu]);

  // Scrolling well away from the words closes it
  useEffect(() => {
    if (!popOpen || confirmed) return;
    const start = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - start) > 240 && closeDraft();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [popOpen, confirmed, closeDraft]);

  // HDR: FIRST-RUN HINT (once per browser, after the reader is into the body)
  useEffect(() => {
    if (hintSeen() || getMark(slug)) return;
    let timer: number | undefined;
    const check = () => {
      const r = root.current;
      if (!r || r.getBoundingClientRect().top > window.innerHeight * 0.4) return;
      window.removeEventListener("scroll", check);
      timer = window.setTimeout(() => {
        if (hintSeen()) return;
        setHint(true);
        setHintSeen();
      }, 1400);
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", check);
      window.clearTimeout(timer);
    };
  }, [slug]);

  useEffect(() => {
    if (!hint) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setHint(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hint]);

  // HDR: RESUME
  const jump = () => {
    const el = ribbon.current;
    if (!el) return;
    setResumeDismissed(true);
    trackEvent("Blog Place Resumed", { slug });
    const done = () => {
      setStroke((s) => s + 1);
      el.focus({ preventScroll: true });
    };
    const offsetY = -Math.round(window.innerHeight * 0.38);
    if (lenis && !reduce) {
      lenis.scrollTo(el, { offset: offsetY, duration: 1.3, onComplete: done });
    } else {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offsetY });
      done();
    }
  };

  const first = lines[0];
  const showResume = introDone && restored && hasMark && below && !reached && !resumeDismissed && !hint;
  const showHint = introDone && hint && !mark;
  const showLabel = hasMark && (label || hover) && !menu;
  const markName = exact ? "You stopped here" : "Around where you stopped";

  return (
    <div ref={wrap} className="relative isolate">
      <div ref={root} onPointerDown={onPointerDown} onClick={onClick} onMouseUp={onMouseUp}>
        {children}
      </div>

      {/* SUB: Highlighter strokes, painted behind the text */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {!confirmed &&
          draftLines.map((l, i) => (
            <span
              key={`draft-${draft?.id}-${i}`}
              className="place-stroke-draft absolute block"
              style={{ left: l.left - 2, top: l.top + l.height * 0.06, width: l.width + 4, height: l.height * 0.9 }}
            />
          ))}
        {lines.map((l, i) => {
          const delay = 0.1 + lines.slice(0, i).reduce((t, p) => t + strokeTime(p.width), 0);
          return (
            <motion.span
              key={`${stroke}-${i}`}
              className="place-stroke absolute block"
              style={{ left: l.left - 3, top: l.top + l.height * 0.06, width: l.width + 6, height: l.height * 0.9 }}
              initial={stroke > 0 && !reduce ? { clipPath: "inset(0 100% 0 0)" } : false}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: strokeTime(l.width), delay, ease: [0.45, 0, 0.2, 1] }}
            />
          );
        })}
      </div>

      {/* SUB: Margin ribbon + its name tag */}
      {first && mark && (
        <>
          <motion.button
            key={mark.savedAt}
            ref={ribbon}
            type="button"
            aria-label={`${markName}: “${clip(mark.quote, 60)}”. Options`}
            aria-haspopup="dialog"
            aria-expanded={menu}
            onClick={() => {
              const wasOpen = menu;
              closeDraft();
              if (wasOpen) return;
              // Opened from the keyboard: Escape brings focus back here
              if (document.activeElement === ribbon.current) {
                returnFocus.current = ribbon.current;
                keyboardOpen.current = true;
              }
              setMenu(true);
            }}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            onFocus={() => setHover(true)}
            onBlur={() => setHover(false)}
            className="group absolute -left-[1.55rem] z-10 grid h-10 w-7 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent md:-left-11"
            style={{ top: first.top + first.height / 2 - 20 }}
            initial={stroke > 0 && !reduce ? { y: -22, opacity: 0, rotate: -14 } : false}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22, delay: 0.15 }}
          >
            <Ribbon className="h-7 w-[0.95rem] transition-transform duration-300 ease-expo group-hover:-translate-y-0.5 md:h-8 md:w-4" />
          </motion.button>

          <AnimatePresence>
            {showLabel && (
              <motion.span
                aria-hidden="true"
                className="pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-on shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)]"
                style={{ left: Math.max(0, first.left - 4), top: first.top - 30 }}
                initial={{ opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
              >
                {markName}
                <span className="absolute -bottom-1 left-3 size-2 rotate-45 rounded-[1px] bg-accent" />
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}

      {/* SUB: Confirm / options popover */}
      <FloatingPortal>
      <AnimatePresence>
        {popOpen && (
          <div
            ref={pop.refs.setFloating}
            style={pop.floatingStyles}
            className="z-[480]"
            data-place-skip
            {...getFloatingProps()}
          >
            <motion.div
              role="dialog"
              aria-label={menu ? "Your saved place" : "Mark your place"}
              initial={{ opacity: 0, y: 6, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="flex items-center gap-1 rounded-full border border-foreground/10 bg-popover p-1 text-popover-foreground shadow-[0_14px_32px_-14px_rgb(0_0_0/0.5)]"
            >
              {menu && mark ? (
                <>
                  <span className="flex items-center gap-2 pl-3 pr-1.5 text-sm">
                    <span className="font-medium">{markName}</span>
                    <span className="text-foreground/60">{timeAgo(mark.savedAt)}</span>
                  </span>
                  <button
                    ref={primary}
                    type="button"
                    onClick={remove}
                    className="h-9 rounded-full px-3.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Remove
                  </button>
                  <IconButton label="Close" onClick={closeDraft} />
                </>
              ) : confirmed ? (
                <span className="flex h-9 items-center gap-2 px-3.5 text-sm font-medium">
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 18 }}
                    className="grid size-5 place-items-center rounded-full bg-accent text-accent-on"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </motion.span>
                  Saved for next time
                </span>
              ) : (
                <>
                  <button
                    ref={primary}
                    type="button"
                    onClick={confirm}
                    className="flex h-9 items-center gap-2 rounded-full bg-accent pl-3 pr-4 text-sm font-semibold text-accent-on transition-[filter,transform] duration-200 hover:brightness-105 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
                  >
                    <BookmarkPlus className="size-4" />
                    {mark ? "Move my mark here" : draft?.kind === "passage" ? "Mark this passage" : "Mark my place"}
                  </button>
                  <IconButton label="Cancel" onClick={closeDraft} />
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </FloatingPortal>

      {/* SUB: Bottom-left slot: the resume pill, or the one-time hint */}
      <FloatingPortal>
      <AnimatePresence>
        {showResume && mark && (
          <motion.div
            key="resume"
            data-place-skip
            className="fixed bottom-5 left-4 right-[5.5rem] z-[490] flex md:bottom-6 md:left-6 md:right-auto"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.5 } }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.25 } }}
          >
            <div className="flex min-w-0 items-center gap-0.5 rounded-full border border-foreground/10 bg-popover p-1 text-popover-foreground shadow-[0_18px_40px_-18px_rgb(0_0_0/0.5)]">
              <button
                type="button"
                onClick={jump}
                className="group flex min-w-0 items-center gap-3 rounded-full py-1 pl-1 pr-3 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 dark:bg-accent/20">
                  <Ribbon className="h-5 w-3" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">Pick up where you left off</span>
                  <span className="mt-0.5 block max-w-[17rem] truncate text-xs leading-tight text-foreground/65">
                    {snippetBefore(mark)}
                    <span className="font-semibold text-accent-ink dark:text-accent">{clip(mark.quote, 40)}</span>
                  </span>
                </span>
                <ArrowDown className="size-4 shrink-0 text-foreground/50 transition-transform duration-300 ease-expo group-hover:translate-y-0.5 group-hover:text-foreground" />
              </button>
              <IconButton label="Dismiss" onClick={() => setResumeDismissed(true)} />
            </div>
          </motion.div>
        )}

        {showHint && (
          <motion.aside
            key="hint"
            data-place-skip
            aria-label="Reading tip"
            className="fixed bottom-5 left-4 right-[5.5rem] z-[490] md:bottom-6 md:left-6 md:right-auto md:w-[21rem]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: 18, transition: { duration: 0.25 } }}
          >
            <div className="relative rounded-[1.25rem] border border-foreground/10 bg-popover p-4 pr-11 text-popover-foreground shadow-[0_22px_48px_-20px_rgb(0_0_0/0.55)]">
              <HintDemo reduce={Boolean(reduce)} />
              <p className="mt-3.5 font-display text-lg font-semibold leading-tight tracking-[-0.02em]">
                Stepping away?
              </p>
              <p className="mt-1 text-pretty text-sm leading-snug text-foreground/70">
                {`${coarse ? "Tap" : "Click"} any word and I’ll keep your place for next time.`}
                {!coarse && (
                  <>
                    {" "}
                    Or press{" "}
                    <kbd className="rounded border border-foreground/20 bg-foreground/[0.06] px-1.5 py-px font-mono text-[0.7rem] font-semibold text-foreground">
                      M
                    </kbd>{" "}
                    to mark the line you&rsquo;re on.
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setHint(false)}
                className="mt-3 h-8 rounded-full bg-foreground px-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
              >
                Got it
              </button>
              <IconButton label="Close tip" onClick={() => setHint(false)} className="absolute right-1.5 top-1.5" />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      </FloatingPortal>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}

// HDR: PIECES

// The bookmark ribbon: accent tape tucked under the page edge, notched tail
function Ribbon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 32" aria-hidden="true" className={cn("overflow-visible drop-shadow-[0_3px_3px_rgb(0_0_0/0.28)]", className)}>
      <path d="M1 0h14a1 1 0 0 1 1 1v30l-8-6.2L0 31V1a1 1 0 0 1 1-1Z" className="fill-accent" />
      <path d="M0 0h16v4H0z" className="fill-foreground/20" />
      <path d="M4 4v20.6" className="stroke-background/40" strokeWidth="1" />
    </svg>
  );
}

// The hint shows the feature instead of describing it: a line of text gets
// the stroke, then the ribbon, then both fade and it starts again
const DEMO = { duration: 4.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" } as const;

function HintDemo({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden="true" className="flex items-center gap-2.5 rounded-xl bg-background/70 px-3 py-2.5 dark:bg-foreground/[0.04]">
      <motion.span
        className="block"
        initial={false}
        animate={reduce ? undefined : { y: [-10, -10, 0, 0, 0], opacity: [0, 0, 1, 1, 0] }}
        transition={{ ...DEMO, times: [0, 0.34, 0.44, 0.88, 1] }}
      >
        <Ribbon className="h-6 w-3" />
      </motion.span>
      <span className="text-[0.95rem] leading-none text-foreground/80">
        &hellip;and we pick it up{" "}
        <span className="relative isolate inline-block font-medium text-foreground">
          <motion.span
            className="place-stroke absolute -inset-x-0.5 inset-y-[-0.1em] -z-10 block"
            initial={false}
            animate={
              reduce
                ? undefined
                : {
                    clipPath: ["inset(0 100% 0 0)", "inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)"],
                    opacity: [1, 1, 1, 1, 0],
                  }
            }
            transition={{ ...DEMO, times: [0, 0.12, 0.3, 0.88, 1] }}
          />
          right here
        </span>
      </span>
    </div>
  );
}

function IconButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-foreground/55 transition-colors hover:bg-foreground/[0.07] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      <X className="size-4" />
    </button>
  );
}

// HDR: HELPERS
function overlaps(range: Range, saved: Range | null) {
  if (!saved) return false;
  // range starts before saved ends, and ends after saved starts
  return (
    range.compareBoundaryPoints(Range.END_TO_START, saved) <= 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, saved) >= 0
  );
}

function strokeTime(width: number) {
  return Math.min(0.6, Math.max(0.22, width / 900));
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// A few words leading into the mark, so a one-word mark has context
function snippetBefore(mark: PlaceMark) {
  const words = mark.prefix.trim().split(/\s+/).filter(Boolean).slice(-4);
  return words.length ? `…${words.join(" ")} ` : "";
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(at: number) {
  const seconds = Math.round((at - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30) return relative.format(Math.round(seconds / 86_400), "day");
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const coarseQuery = "(pointer: coarse)";
function useCoarsePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(coarseQuery);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(coarseQuery).matches,
    () => false,
  );
}
