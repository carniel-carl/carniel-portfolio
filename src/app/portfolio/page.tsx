"use client";
import MaxWidth from "@/components/general/MaxWidth";
import FloatNav from "@/components/layout/navbar/FloatNav";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { navLinksData } from "@/data/navlinks";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";

const PortfolioPage = () => {
  return (
    <>
      <FloatNav data={navLinksData} />
      <ScrollToTop />
      <MaxWidth className="lg:max-w-[65rem] md:max-w-[40rem] mb-28">
        <About />
        <div className="divider" />
        <Projects />
        <div className="divider" />
        <Skills />
        <div className="divider" />
        <Contact />
      </MaxWidth>
    </>
  );
};

export default PortfolioPage;
