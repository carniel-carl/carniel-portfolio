"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

// Keeps <meta name="theme-color"> equal to the page background of the theme
// the visitor picked on the site (not their phone's system setting), so the
// mobile status bar and URL bar match it and update the moment it changes.
// Browsers that honour theme-color also stop tinting the bars from fixed
// elements, such as the teal curtain footer.
const ThemeColorSync = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Read the colour actually painted, so it can't drift from the CSS tokens
    const color = getComputedStyle(document.body).backgroundColor;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [resolvedTheme]);

  return null;
};

export default ThemeColorSync;
