"use client";
import MaxWidth from "@/components/general/MaxWidth";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { navLinksData } from "@/data/navlinks";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";
import dynamic from "next/dynamic";

const FloatNav = dynamic(() => import("@/components/layout/navbar/FloatNav"), {
  ssr: false,
});

const PortfolioPage = () => {
  return (
    <div className="w-screen min-h-[calc(100svh-2rem)] overflow-x-hidden">
      <FloatNav data={navLinksData} />
      <ScrollToTop />
      <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-24 w-[90%] mx-auto ">
        <About />
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

// {/* <AnimatePresence mode="wait">
// {/* {isLoading ? (
//   <motion.div key="preloader">
//     <PreLoader setIsLoading={setIsLoading} />
//   </motion.div>
// ) : ( */}
// <>
//   <FloatNav data={navLinksData} />
//   <ScrollToTop />
//   <MaxWidth className="lg:!max-w-[65rem] md:!max-w-[40rem] mb-28">
//     <About />
//     <div className="divider" />
//     <Projects />
//     <div className="divider" />
//     <Skills />
//     <div className="divider" />
//     <Contact />
//   </MaxWidth>
// </>
// {/* )} */}
// </AnimatePresence> */}
