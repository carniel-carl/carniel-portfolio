import MaxWidth from "@/components/general/MaxWidth";
import FloatNavDynamic from "@/components/layout/navbar/FloatNavDynamic";
import ScrollToTop from "@/components/layout/ScrollToTop";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";
import { Suspense } from "react";

const PortfolioPage = () => {
  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      <FloatNavDynamic />
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto ">
        <Suspense fallback={null}>
          <About />
        </Suspense>
        <div className="divider" />

        <Projects />
        <div className="divider" />
        <Skills />
        <div className="divider" />
        <Contact />
      </MaxWidth>
    </div>
  );
};

export default PortfolioPage;
