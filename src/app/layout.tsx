import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Nunito_Sans, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import ThemeWrapper from "@/context/theme-provider";
import Navbar from "@/components/layout/navbar/Navbar";
import Footer from "@/components/layout/Footer";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--montserrat",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--montserrat",
});
const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--nunito",
});

export const metadata: Metadata = {
  title: "Chimezie's portfolio",
  description: "Hello, Welcome to my portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} ${montserrat.variable}  ${nunito.variable} antialiased overscroll-none relative min-h-screen`}
      >
        <ThemeWrapper>
          <div className="grid grid-rows-[3.5rem_1fr]">
            <div>
              <Navbar />
            </div>
            <main className="row-start-2 row-end-3">{children}</main>
          </div>
          <Footer />
          <Toaster richColors position="top-center" />
        </ThemeWrapper>
      </body>
    </html>
  );
}
