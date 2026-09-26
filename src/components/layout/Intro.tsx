"use client";

import { AnimatePresence, useReducedMotion } from "framer-motion";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import PreLoader from "@/components/layout/PreLoader";

// The path this tab originally loaded (module evaluates once per full load).
// The intro plays only on that page, and only once: a reload replays it, a
// client-side navigation never does. Robust to streamed/suspended pages.
const initialPath =
  typeof window !== "undefined" ? window.location.pathname : null;
let played = false;
const shouldPlayIntro = () =>
  !played && window.location.pathname === initialPath;

// Global "is an intro curtain covering the page" signal, for UI that lives
// outside <Intro> (e.g. the floating sound player in the layout)
let covering = false;
const listeners = new Set<() => void>();
const setCovering = (v: boolean) => {
  covering = v;
  listeners.forEach((l) => l());
};
export const useIntroDone = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => !covering,
    () => false,
  );

// `true` once the page is uncovered (always true outside an <Intro>)
const IntroReadyContext = createContext(true);
export const useIntroReady = () => useContext(IntroReadyContext);

const Intro = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();
  const [showLoader, setShowLoader] = useState(true);
  const [ready, setReady] = useState(false);

  // Decide before first paint so a skipped intro never flashes.
  // Decided once per instance (a ref survives StrictMode's double effects)
  const decision = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    if (decision.current === null) {
      decision.current = shouldPlayIntro() && !reduce;
      played = true;
    }
    if (!decision.current) {
      setShowLoader(false);
      setReady(true);
    } else {
      setCovering(true);
    }
  }, [reduce]);

  return (
    <IntroReadyContext.Provider value={ready}>
      <AnimatePresence>
        {showLoader && (
          <PreLoader
            key="intro"
            onReveal={() => {
              setReady(true);
              setCovering(false);
            }}
            onComplete={() => setShowLoader(false)}
          />
        )}
      </AnimatePresence>
      {children}
    </IntroReadyContext.Provider>
  );
};

export default Intro;
