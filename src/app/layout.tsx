import type { Metadata } from "next";
import { Montserrat, Nunito_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar/Navbar";
import dynamic from "next/dynamic";
import PageLoader from "@/components/general/PageLoader";

const ThemeWrapper = dynamic(() => import("@/context/theme-provider"), {
  ssr: false,
  loading: () => <PageLoader />,
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
        className={`${montserrat.className} ${montserrat.variable}  ${nunito.variable}  antialiased`}
      >
        <ThemeWrapper>
          <div className="grid  grid-rows-[4.5rem_1fr]">
            <Navbar />
            <main className="row-start-2 row-end-3">{children}</main>
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}
