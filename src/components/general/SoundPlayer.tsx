"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useDismiss,
  useFloating,
  useInteractions,
  type Placement,
} from "@floating-ui/react";
import {
  AudioLines,
  CloudRain,
  Disc3,
  Link2,
  LoaderCircle,
  LogOut,
  Moon,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Volume1,
  Volume2,
  Waves,
  X,
} from "lucide-react";
import { SiSpotify } from "react-icons/si";
import { cn } from "@/lib/utils";
import { AmbientEngine, SOUNDSCAPES, type SoundscapeId } from "@/lib/ambient";
import { useIntroDone } from "@/components/layout/Intro";
import { usePathname } from "next/navigation";
import routes from "@/lib/routes";
import {
  JUST_CONNECTED_KEY,
  connectSpotify,
  disconnectSpotify,
  fetchSpotifyPlaylists,
  fetchSpotifyProfile,
  isSpotifyConnected,
  loadSpotifyEmbedApi,
  spotifySignInEnabled,
  toSpotifyUri,
  type SpotifyEmbedController,
  type SpotifyPlaylist,
} from "@/lib/spotify";

type TrackId = SoundscapeId | "spotify";

const ICONS: Record<SoundscapeId, typeof Moon> = {
  drift: Sparkles,
  night: Moon,
  choir: AudioLines,
  lofi: Disc3,
  rain: CloudRain,
  ocean: Waves,
};

// Spotify's own "Peaceful Piano" playlist; visitors can connect or paste their own
const DEFAULT_SPOTIFY_URI = "spotify:playlist:37i9dQZF1DX4sWSpwq3LiO";
const PREF_KEY = "carniel:soundscape";
const SPOTIFY_KEY = "carniel:spotify-uri";
const EDGE = 12;

// floating-ui commits each new position with flushSync, and a flushSync while
// React is preparing a view transition makes React skip it (the blog card ->
// post morph). The record bobs, so positions change every frame: sit out
// frames while a transition is active; autoUpdate catches up right after.
const inViewTransition = () => {
  try {
    return document.documentElement.matches(":active-view-transition");
  } catch {
    return false; // Browser without the pseudo-class
  }
};
const pausedDuringViewTransition = (update: () => void) => () => {
  if (!inViewTransition()) update();
};

// Grow the panel out of the corner nearest the record
const originFor = (p: Placement) => {
  const [side, align] = p.split("-") as [string, string | undefined];
  const opposite: Record<string, string> = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  };
  const cross =
    side === "top" || side === "bottom"
      ? align === "end"
        ? "right"
        : align === "start"
          ? "left"
          : "center"
      : align === "end"
        ? "bottom"
        : align === "start"
          ? "top"
          : "center";
  return side === "top" || side === "bottom"
    ? `${cross} ${opposite[side]}`
    : `${opposite[side]} ${cross}`;
};

const Bars = ({ playing }: { playing: boolean }) => (
  <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className={cn(
          "w-[2px] origin-bottom rounded-full bg-current",
          playing ? "h-full animate-eq" : "h-[3px]",
        )}
        style={{ animationDelay: `${i * -0.22}s` }}
      />
    ))}
  </span>
);

// Notes that drift up and away from the record while music plays
const FloatingNotes = () => (
  <span className="pointer-events-none absolute inset-0" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="absolute left-1/2 top-0 text-accent"
        initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
        animate={{
          opacity: [0, 1, 0],
          y: -46,
          x: [0, i === 1 ? -14 : 12, i === 1 ? -20 : 18],
          scale: [0.6, 1, 0.8],
          rotate: i === 1 ? -20 : 15,
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          delay: i * 0.8,
          ease: "easeOut",
        }}
      >
        <Music2 className="size-3.5" />
      </motion.span>
    ))}
  </span>
);

// Floating soundscape player. A little vinyl that bobs in the corner, can be
// dragged anywhere, spins while playing and opens a picker of calm sounds
// (generated live, nothing downloads) plus an optional Spotify embed.
// Panel and hint are positioned with Floating UI, so they flip/shift to
// whichever side of the record has room and never leave the viewport.
const SoundPlayer = () => {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const onPortfolio = usePathname() === routes.public.portfolio;
  const engine = useRef<AmbientEngine | null>(null);
  const bounds = useRef<HTMLDivElement>(null);
  const dragBox = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const dragged = useRef(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState<TrackId>("drift");
  const [volume, setVolume] = useState(0.7);
  const [hint, setHint] = useState(false);
  const [hover, setHover] = useState(false);
  const [spotifyUri, setSpotifyUri] = useState(DEFAULT_SPOTIFY_URI);
  const [spotifyPlaying, setSpotifyPlaying] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[] | null>(null);
  const [playlistState, setPlaylistState] = useState<"idle" | "loading" | "error">("idle");
  const spotifyHost = useRef<HTMLDivElement>(null);
  const controller = useRef<SpotifyEmbedController | null>(null);
  const controllerUri = useRef<string | null>(null);
  const [spotifyReady, setSpotifyReady] = useState(false);

  // Built-in soundscape or Spotify: either one drives the record's animation
  const anyPlaying = playing || spotifyPlaying;

  // HDR: FLOATING PANEL (flip / shift / fit to the viewport)
  const panel = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top-end",
    strategy: "fixed",
    middleware: [
      offset(12),
      flip({
        fallbackPlacements: [
          "bottom-end",
          "left-end",
          "left-start",
          "top-start",
          "bottom-start",
          "right-end",
          "right-start",
        ],
        padding: EDGE,
      }),
      shift({ padding: EDGE }),
      size({
        padding: EDGE,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(220, availableHeight)}px`;
        },
      }),
    ],
  });

  // The panel stays mounted after first open (so an embedded Spotify player
  // keeps playing when it is closed); only track its position while visible.
  const [panelMounted, setPanelMounted] = useState(false);
  useEffect(() => {
    if (open) setPanelMounted(true);
  }, [open]);
  const { reference: panelRef, floating: panelFloating } = panel.refs;
  const updatePanel = panel.update;
  useEffect(() => {
    const ref = panelRef.current;
    const floating = panelFloating.current;
    if (!open || !ref || !floating) return;
    // Follow the record while it bobs or is dragged
    return autoUpdate(ref, floating, pausedDuringViewTransition(updatePanel), {
      animationFrame: true,
    });
  }, [open, panelMounted, panelRef, panelFloating, updatePanel]);

  const dismiss = useDismiss(panel.context, {
    outsidePress: true,
    escapeKey: true,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  // HDR: "PLAY ME" HINT (same collision logic, prefers the right side)
  const showHint = introDone && !open && !anyPlaying && (hint || hover);
  const tip = useFloating({
    open: showHint,
    placement: "left",
    strategy: "fixed",
    middleware: [offset(12), flip({ padding: EDGE }), shift({ padding: EDGE })],
    whileElementsMounted: (ref, floating, update) =>
      autoUpdate(ref, floating, pausedDuringViewTransition(update), {
        animationFrame: true,
      }),
  });

  // Restore preferences (never auto-plays)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY) as TrackId | null;
      if (
        saved &&
        (saved === "spotify" || SOUNDSCAPES.some((s) => s.id === saved))
      )
        setTrack(saved);
      const uri = localStorage.getItem(SPOTIFY_KEY);
      if (uri && toSpotifyUri(uri)) setSpotifyUri(uri);
      setConnected(isSpotifyConnected());
      // Back from Spotify sign-in: reopen straight onto the playlists
      if (sessionStorage.getItem(JUST_CONNECTED_KEY)) {
        sessionStorage.removeItem(JUST_CONNECTED_KEY);
        setTrack("spotify");
        setOpen(true);
      }
    } catch {}
    return () => {
      engine.current?.stop();
      controller.current?.destroy();
    };
  }, []);

  // HDR: SPOTIFY EMBED (official iFrame API, reports play/pause)
  useEffect(() => {
    if (track !== "spotify" || !panelMounted || !spotifyHost.current) return;
    if (controller.current) {
      if (controllerUri.current !== spotifyUri) {
        controller.current.loadUri(spotifyUri);
        controllerUri.current = spotifyUri;
      }
      return;
    }
    let cancelled = false;
    // The API replaces the element it is given, so hand it a node React does not own
    const mount = document.createElement("div");
    spotifyHost.current.appendChild(mount);
    loadSpotifyEmbedApi().then((api) => {
      if (cancelled) return;
      api.createController(mount, { uri: spotifyUri, width: "100%", height: 152 }, (c) => {
        controller.current = c;
        controllerUri.current = spotifyUri;
        setSpotifyReady(true);
        c.addListener("playback_update", (e) => {
          const isPlaying = !e.data.isPaused;
          setSpotifyPlaying(isPlaying);
          // Spotify started: fade out the built-in soundscape
          if (isPlaying) {
            engine.current?.stop();
            setPlaying(false);
          }
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [track, panelMounted, spotifyUri]);

  // Signed-in visitors: load their profile and playlists
  useEffect(() => {
    if (!connected || track !== "spotify" || playlists || playlistState === "loading") return;
    setPlaylistState("loading");
    Promise.all([fetchSpotifyProfile(), fetchSpotifyPlaylists()])
      .then(([name, items]) => {
        setProfileName(name);
        setPlaylists(items);
        setPlaylistState("idle");
      })
      .catch((err: Error) => {
        if (err.message === "not-connected") setConnected(false);
        setPlaylistState("error");
      });
  }, [connected, track, playlists, playlistState]);

  // Nudge first-time visitors once the intro has lifted
  useEffect(() => {
    if (!introDone) {
      setHint(false);
      return;
    }
    const show = setTimeout(() => setHint(true), 1400);
    const hide = setTimeout(() => setHint(false), 7500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [introDone]);

  // Keep a dragged record inside the window when it resizes
  useEffect(() => {
    const clamp = () => {
      const el = dragBox.current;
      const area = bounds.current;
      if (!el || !area) return;
      // Clamp to the drag area, which excludes the navbar strip
      const r = el.getBoundingClientRect();
      const b = area.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (r.right > b.right) dx = b.right - r.right;
      if (r.left < b.left) dx = b.left - r.left;
      if (r.bottom > b.bottom) dy = b.bottom - r.bottom;
      if (r.top < b.top) dy = b.top - r.top;
      if (dx) x.set(x.get() + dx);
      if (dy) y.set(y.get() + dy);
    };
    window.addEventListener("resize", clamp);
    return () => window.removeEventListener("resize", clamp);
  }, [x, y]);

  const getEngine = () => (engine.current ??= new AmbientEngine());

  const remember = (id: TrackId) => {
    try {
      localStorage.setItem(PREF_KEY, id);
    } catch {}
  };

  const play = async (id: TrackId) => {
    setTrack(id);
    setHint(false);
    remember(id);
    if (id === "spotify") {
      // Spotify plays inside its own embed; silence ours
      engine.current?.stop();
      setPlaying(false);
      return;
    }
    controller.current?.pause();
    setSpotifyPlaying(false);
    setPlaying(true);
    getEngine().setVolume(volume);
    await getEngine()
      .play(id)
      .catch(() => setPlaying(false));
  };

  const togglePlay = () => {
    if (track === "spotify") return;
    if (playing) {
      getEngine().stop();
      setPlaying(false);
    } else {
      play(track);
    }
  };

  const chooseSpotify = (uri: string) => {
    setSpotifyUri(uri);
    try {
      localStorage.setItem(SPOTIFY_KEY, uri);
    } catch {}
  };

  const submitSpotify = (e: FormEvent) => {
    e.preventDefault();
    const uri = toSpotifyUri(draftUrl);
    if (!uri) {
      setUrlError(true);
      return;
    }
    setUrlError(false);
    setDraftUrl("");
    chooseSpotify(uri);
  };

  const signOut = () => {
    disconnectSpotify();
    setConnected(false);
    setPlaylists(null);
    setProfileName(null);
    setPlaylistState("idle");
  };

  const currentName =
    track === "spotify"
      ? "Spotify"
      : SOUNDSCAPES.find((s) => s.id === track)!.name;

  return (
    <>
      {/* Drag bounds: the viewport minus a small margin */}
      <div
        ref={bounds}
        className="pointer-events-none fixed inset-x-3 bottom-3 top-[4.75rem] !z-[2000] md:top-[5.25rem]"
        aria-hidden="true"
      />

      <motion.div
        ref={dragBox}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={bounds}
        dragElastic={0.12}
        dragMomentum={false}
        style={{ x, y }}
        onDragStart={() => {
          dragged.current = true;
          setHint(false);
        }}
        className={cn(
          "vt-chrome-player fixed bottom-5 right-5 z-[500] md:bottom-6 md:right-6",
          // Clear the floating section dock on phones
          onPortfolio && "max-md:bottom-24",
        )}
      >
        {/* Entrance: pops in once the intro curtain is gone. Mounted lazily
            (SoundPlayerLazy), usually after the intro, so start hidden. */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={
            introDone
              ? {
                  scale: 1,
                  opacity: 1,
                  rotate: reduce ? 0 : [0, -12, 10, -6, 0],
                }
              : { scale: 0, opacity: 0, rotate: 0 }
          }
          transition={{
            scale: { type: "spring", stiffness: 260, damping: 16, delay: 0.3 },
            opacity: { duration: 0.3, delay: 0.3 },
            rotate: { duration: 0.9, delay: 0.7 },
          }}
        >
          {/* Idle bob */}
          <motion.div
            animate={reduce || open ? { y: 0 } : { y: [0, -6, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <AnimatePresence>
              {anyPlaying && !reduce && <FloatingNotes />}
            </AnimatePresence>

            {/* Attention ring behind the record while hinting */}
            {showHint && !reduce && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-accent"
                initial={{ scale: 1, opacity: 0.45 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}

            <motion.button
              type="button"
              ref={(node) => {
                panel.refs.setReference(node);
                tip.refs.setReference(node);
              }}
              {...getReferenceProps({
                onPointerDown: (e) => {
                  dragged.current = false;
                  dragControls.start(e);
                },
                onClick: () => {
                  if (!dragged.current) {
                    setOpen((o) => !o);
                    setHint(false);
                  }
                },
                onPointerEnter: () => setHover(true),
                onPointerLeave: () => setHover(false),
              })}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label={
                open
                  ? "Close music player"
                  : `Music player, ${anyPlaying ? `playing ${currentName}` : "paused"}`
              }
              aria-expanded={open}
              aria-haspopup="dialog"
              className="relative grid size-14 cursor-grab touch-none place-items-center rounded-full shadow-[0_14px_36px_-12px_hsl(var(--foreground)/0.55)] outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
            >
              {/* Vinyl */}
              <motion.span
                animate={anyPlaying && !reduce ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  anyPlaying
                    ? { duration: 4, repeat: Infinity, ease: "linear" }
                    : { duration: 0.6 }
                }
                className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,hsl(0_0%_8%)_0_2px,hsl(0_0%_14%)_2px_3px)] ring-1 ring-white/10"
              >
                <span className="absolute inset-[30%] rounded-full bg-accent">
                  <span className="absolute left-1/2 top-[18%] size-1 -translate-x-1/2 rounded-full bg-accent-on/70" />
                </span>
                <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background" />
              </motion.span>
              <span className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent_0deg,rgb(255_255_255/0.16)_40deg,transparent_90deg,transparent_200deg,rgb(255_255_255/0.1)_240deg,transparent_280deg)]" />
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      <FloatingPortal>
        {/* SUB: "Play me" hint / now-playing chip */}
        <AnimatePresence>
          {(showHint || (anyPlaying && !open && introDone)) && (
            <div
              key="tip"
              ref={tip.refs.setFloating}
              style={tip.floatingStyles}
              className="pointer-events-none z-[501]"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                style={{ transformOrigin: originFor(tip.placement) }}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg",
                  anyPlaying
                    ? "border border-foreground/10 bg-background/85 font-medium text-foreground backdrop-blur-xl"
                    : "bg-accent text-accent-on",
                )}
              >
                {anyPlaying ? (
                  <>
                    <span className="text-accent-ink dark:text-accent">
                      <Bars playing />
                    </span>
                    {currentName}
                  </>
                ) : (
                  <>
                    <motion.span
                      animate={reduce ? undefined : { rotate: [0, -15, 15, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 0.6,
                      }}
                    >
                      <Music2 className="size-3.5" />
                    </motion.span>
                    Play me
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SUB: Picker panel */}
        {panelMounted && (
            <div
              ref={panel.refs.setFloating}
              style={panel.floatingStyles}
              className={cn("z-[501] flex", !open && "pointer-events-none")}
              // Closed = hidden, not unmounted: removing the iframe would stop Spotify
              inert={!open}
              aria-hidden={!open}
              {...getFloatingProps()}
            >
              <motion.div
                role="dialog"
                aria-label="Music player"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                animate={
                  open
                    ? { opacity: 1, scale: 1, filter: "blur(0px)", visibility: "visible" }
                    : {
                        opacity: 0,
                        scale: 0.92,
                        filter: "blur(6px)",
                        transitionEnd: { visibility: "hidden" },
                      }
                }
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{ transformOrigin: originFor(panel.placement) }}
                data-lenis-prevent
                className="flex max-h-full w-[18.5rem] flex-col overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-background/85 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.08),0_30px_70px_-25px_hsl(var(--foreground)/0.45)] backdrop-blur-2xl"
              >
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <p className="font-display text-lg font-semibold tracking-[-0.02em]">
                    Soundscapes
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close music player"
                    className="grid size-7 place-items-center rounded-full text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                  <ul className="flex flex-col gap-1">
                    {[
                      ...SOUNDSCAPES,
                      {
                        id: "spotify" as const,
                        name: "Spotify",
                        description: "Connect or paste a playlist",
                        vocal: false,
                      },
                    ].map((s, i) => {
                      const Icon = s.id === "spotify" ? SiSpotify : ICONS[s.id];
                      const active = track === s.id;
                      return (
                        <motion.li
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.05 + i * 0.05,
                            duration: 0.4,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => play(s.id)}
                            aria-pressed={active}
                            className={cn(
                              "relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                              active
                                ? "text-accent-on"
                                : "hover:bg-foreground/[0.06]",
                            )}
                          >
                            {active && (
                              <motion.span
                                layoutId="sound-active"
                                className="absolute inset-0 rounded-xl bg-accent"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 32,
                                }}
                              />
                            )}
                            <span
                              className={cn(
                                "relative grid size-9 shrink-0 place-items-center rounded-full",
                                active
                                  ? "bg-accent-on/15"
                                  : "bg-foreground/[0.07]",
                                s.id === "spotify" &&
                                  !active &&
                                  "text-[#1DB954]",
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <span className="relative flex min-w-0 flex-1 flex-col">
                              <span className="flex items-center gap-1.5 text-sm font-semibold">
                                {s.name}
                                {s.vocal && (
                                  <span
                                    className={cn(
                                      "rounded-full px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-wide",
                                      active ? "bg-accent-on/15" : "bg-foreground/10 text-foreground/70",
                                    )}
                                  >
                                    Vocal
                                  </span>
                                )}
                              </span>
                              <span
                                className={cn(
                                  "truncate text-xs",
                                  active
                                    ? "text-accent-on/75"
                                    : "text-foreground/55",
                                )}
                              >
                                {s.description}
                              </span>
                            </span>
                            {active && (
                              <span className="relative">
                                <Bars playing={s.id === "spotify" ? spotifyPlaying : playing} />
                              </span>
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>

                  {/* SUB: Spotify. Kept mounted (hidden) so playback survives switching */}
                  <div className={cn("flex flex-col gap-3 pt-3", track !== "spotify" && "hidden")}>
                    {!spotifySignInEnabled && process.env.NODE_ENV !== "production" && (
                      <p className="rounded-lg border border-dashed border-foreground/25 px-3 py-2 text-[0.7rem] leading-snug text-foreground/70">
                        Dev note: set <code className="font-mono">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> in
                        .env and restart the dev server to show &ldquo;Connect Spotify&rdquo;.
                      </p>
                    )}

                    {spotifySignInEnabled && !connected && (
                      <button
                        type="button"
                        onClick={() => connectSpotify()}
                        className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#1DB954] text-sm font-semibold text-[#0b1f12] transition-transform active:scale-[0.97]"
                      >
                        <SiSpotify className="size-4" aria-hidden="true" />
                        Connect Spotify
                      </button>
                    )}

                    {connected && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-foreground/70">
                            {profileName ? `Signed in as ${profileName}` : "Your playlists"}
                          </span>
                          <button
                            type="button"
                            onClick={signOut}
                            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-foreground/60 transition-colors hover:bg-foreground/10 hover:text-foreground"
                          >
                            <LogOut className="size-3" aria-hidden="true" />
                            Disconnect
                          </button>
                        </div>

                        {playlistState === "loading" && (
                          <div className="flex flex-col gap-1.5" aria-label="Loading playlists">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="flex items-center gap-2.5 p-1">
                                <span className="size-9 animate-pulse rounded-md bg-foreground/10" />
                                <span className="h-3 flex-1 animate-pulse rounded bg-foreground/10" />
                              </div>
                            ))}
                          </div>
                        )}

                        {playlistState === "error" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlaylists(null);
                              setPlaylistState("idle");
                            }}
                            className="flex items-center gap-2 rounded-lg bg-foreground/[0.06] px-3 py-2 text-left text-xs text-foreground/75"
                          >
                            <RefreshCw className="size-3.5 shrink-0" aria-hidden="true" />
                            Couldn&apos;t load your playlists. Try again.
                          </button>
                        )}

                        {playlists && playlists.length === 0 && (
                          <p className="text-xs text-foreground/60">
                            No playlists yet. Paste any Spotify link below.
                          </p>
                        )}

                        {playlists && playlists.length > 0 && (
                          <ul className="flex max-h-44 flex-col gap-0.5 overflow-y-auto pr-1">
                            {playlists.map((pl) => (
                              <li key={pl.id}>
                                <button
                                  type="button"
                                  onClick={() => chooseSpotify(pl.uri)}
                                  aria-pressed={spotifyUri === pl.uri}
                                  className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg p-1 text-left transition-colors",
                                    spotifyUri === pl.uri ? "bg-foreground/10" : "hover:bg-foreground/[0.06]",
                                  )}
                                >
                                  {pl.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={pl.image} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                                  ) : (
                                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-foreground/10">
                                      <Music2 className="size-4 text-foreground/50" />
                                    </span>
                                  )}
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate text-xs font-semibold">{pl.name}</span>
                                    <span className="text-[0.7rem] text-foreground/55">
                                      {pl.tracks} {pl.tracks === 1 ? "track" : "tracks"}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Official embed, controlled via the iFrame API */}
                    <div
                      ref={spotifyHost}
                      className="min-h-[152px] overflow-hidden rounded-xl bg-foreground/5 [&_iframe]:block [&_iframe]:rounded-xl"
                    >
                      {!spotifyReady && (
                        <div className="grid h-[152px] place-items-center text-foreground/40">
                          <LoaderCircle className="size-5 animate-spin" aria-label="Loading Spotify" />
                        </div>
                      )}
                    </div>

                    <form onSubmit={submitSpotify} className="flex flex-col gap-1.5">
                      <label htmlFor="spotify-url" className="text-xs font-medium text-foreground/75">
                        {connected ? "Or paste any Spotify link" : "Paste a playlist, album or track link"}
                      </label>
                      <div className="flex gap-1.5">
                        <div className="relative flex-1">
                          <Link2
                            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/45"
                            aria-hidden="true"
                          />
                          <input
                            id="spotify-url"
                            type="text"
                            inputMode="url"
                            value={draftUrl}
                            onChange={(e) => {
                              setDraftUrl(e.target.value);
                              setUrlError(false);
                            }}
                            aria-invalid={urlError}
                            aria-describedby="spotify-help"
                            className="h-8 w-full rounded-lg border border-foreground/15 bg-transparent pl-7 pr-2 text-xs outline-none transition-colors focus:border-accent-ink"
                          />
                        </div>
                        <button
                          type="submit"
                          className="h-8 shrink-0 rounded-lg bg-foreground px-3 text-xs font-semibold text-background active:scale-95"
                        >
                          Load
                        </button>
                      </div>
                      <p
                        id="spotify-help"
                        className={cn(
                          "text-[0.7rem] leading-snug",
                          urlError ? "text-destructive dark:text-red-400" : "text-foreground/55",
                        )}
                      >
                        {urlError
                          ? "That doesn't look like a Spotify link."
                          : "Full tracks play when you're logged in to Spotify in this browser."}
                      </p>
                    </form>
                  </div>
                </div>

                {/* SUB: Transport (built-in soundscapes only) */}
                {track !== "spotify" && (
                  <div className="flex items-center gap-3 border-t border-foreground/10 px-4 py-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={playing ? "Pause" : "Play"}
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform active:scale-90"
                    >
                      {playing ? (
                        <Pause className="size-4" />
                      ) : (
                        <Play className="ml-0.5 size-4" />
                      )}
                    </button>
                    <Volume1
                      className="size-4 shrink-0 text-foreground/50"
                      aria-hidden="true"
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      aria-label="Volume"
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        engine.current?.setVolume(v);
                      }}
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-[var(--clr)]"
                    />
                    <Volume2
                      className="size-4 shrink-0 text-foreground/50"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </motion.div>
            </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default SoundPlayer;
