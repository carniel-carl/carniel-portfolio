"use client";

import { useLenis } from "lenis/react";
import { useLayoutEffect } from "react";

// Next resets scroll only after the view transition has captured the new page,
// so a post opened from lower down the list is captured with its hero above
// the viewport and React drops the cover/title morph. Jump to the top during
// the commit instead, before the new snapshot is taken.
const ScrollToTopOnEnter = () => {
  const lenis = useLenis();

  useLayoutEffect(() => {
    // Leave deep links to a heading alone
    if (window.location.hash) return;
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
    // Only on mount: lenis resolving later must not re-scroll the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default ScrollToTopOnEnter;
