"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { useReducedMotion } from "framer-motion";
import { ReactNode, useEffect, useMemo } from "react";
import "lenis/dist/lenis.css";

// Radix modals (dialogs, sheets, command palette) lock scrolling by setting
// data-scroll-locked on <body>. Lenis scrolls the page from its own wheel
// listener, which bypasses that lock, so pause it while a modal is open.
const PauseWhileScrollLocked = () => {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const sync = () => {
      if (document.body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-scroll-locked"],
    });

    return () => {
      observer.disconnect();
      lenis.start();
    };
  }, [lenis]);

  return null;
};

// Inertia scrolling for the public site. Native scroll position is kept in
// sync, so framer-motion's useScroll keeps working unchanged underneath.
const SmoothScroll = ({ children }: { children: ReactNode }) => {
  const reduce = useReducedMotion();

  const options = useMemo(
    () => ({
      lerp: reduce ? 1 : 0.09,
      smoothWheel: !reduce,
      anchors: { offset: -80 },
    }),
    [reduce],
  );

  return (
    <ReactLenis root options={options}>
      <PauseWhileScrollLocked />
      {children}
    </ReactLenis>
  );
};

export default SmoothScroll;
