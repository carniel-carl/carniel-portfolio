"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "framer-motion";
import { ReactNode, useMemo } from "react";
import "lenis/dist/lenis.css";

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
      {children}
    </ReactLenis>
  );
};

export default SmoothScroll;
