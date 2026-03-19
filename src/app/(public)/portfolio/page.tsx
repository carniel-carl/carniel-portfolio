export const dynamic = "force-dynamic";

import MaxWidth from "@/components/general/MaxWidth";
import ScrollToTop from "@/components/layout/ScrollToTop";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";
import nextDynamic from "next/dynamic";
import { Suspense } from "react";

const FloatNav = nextDynamic(
  () => import("@/components/layout/navbar/FloatNav"),
  {
    ssr: false,
  },
);

const PortfolioPage = () => {
  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      <Suspense
        fallback={<div className="h-96 animate-pulse bg-muted rounded" />}
      >
        <FloatNav />
      </Suspense>
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto ">
        <Suspense
          fallback={<div className="h-96 animate-pulse bg-muted rounded" />}
        >
          <About />
        </Suspense>
        <div className="divider" />
        <Suspense
          fallback={<div className="h-96 animate-pulse bg-muted rounded" />}
        >
          <Projects />
        </Suspense>
        <div className="divider" />
        <Suspense
          fallback={<div className="h-96 animate-pulse bg-muted rounded" />}
        >
          <Skills />
        </Suspense>
        <div className="divider" />
        <Contact />
      </MaxWidth>
    </div>
  );
};

export default PortfolioPage;
