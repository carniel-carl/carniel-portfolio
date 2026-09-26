import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ThemeWrapper from "@/context/theme-provider";

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
  title: "Chimezie's portfolio",
  description:
    "Chimezie (Carniel) is a web and mobile developer building fast, accessible apps with React, Next.js and React Native.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
