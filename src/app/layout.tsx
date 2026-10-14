import "./globals.css";
import type { Metadata } from "next";
import { Recursive } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ThemeWrapper from "@/context/theme-provider";
import {
  BASE_OPEN_GRAPH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import { ADSENSE_CLIENT } from "@/lib/adsense";

// One family for every role. Recursive's own axes carry the hierarchy:
// Casual (a loaded brush) for display, linear for reading, Mono for labels,
// numbers and code. Roles are mapped to axis settings in globals.css.
const recursive = Recursive({
  subsets: ["latin"],
  axes: ["CASL", "CRSV", "MONO", "slnt"],
  variable: "--font-recursive",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative canonical / Open Graph URLs to absolute ones
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/images/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/images/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/images/favicon/apple-touch-icon.png",
  },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", creator: "@dripcarniel" },
  // Lets AdSense verify site ownership
  ...(ADSENSE_CLIENT && {
    other: { "google-adsense-account": ADSENSE_CLIENT },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {ADSENSE_CLIENT && (
        <head>
          {/* Plain <script>: AdSense rejects next/script's data-nscript attribute */}
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        </head>
      )}
      <body
        className={`${recursive.variable} font-sans antialiased overscroll-none relative min-h-screen`}
      >
        <ThemeWrapper>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeWrapper>
      </body>
    </html>
  );
}
