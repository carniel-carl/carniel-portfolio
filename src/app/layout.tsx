import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
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

// Display: variable width + optical size axes drive the kinetic headlines
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-display",
  display: "swap",
});
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased overscroll-none relative min-h-screen`}
      >
        <ThemeWrapper>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeWrapper>
      </body>
    </html>
  );
}
