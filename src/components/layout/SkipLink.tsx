"use client";

// First tab stop on every public page. Lenis intercepts "#" anchor clicks,
// so focus <main> directly instead of relying on the browser's jump.
const SkipLink = () => (
  <a
    href="#main"
    onClick={(e) => {
      e.preventDefault();
      document.getElementById("main")?.focus();
    }}
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2001] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-background focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
  >
    Skip to content
  </a>
);

export default SkipLink;
