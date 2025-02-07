import MaxWidth from "@/components/general/MaxWidth";
import About from "@/sections/About";
import Contact from "@/sections/Contact";
import Projects from "@/sections/Projects";
import Skills from "@/sections/Skills";

const PortfolioPage = () => {
  return (
    <MaxWidth className="lg:max-w-[65rem] md:max-w-[40rem] mb-20">
      <About />
      <div className="divider" />
      <Projects />
      <div className="divider" />
      <Skills />
      <div className="divider" />
      <Contact />
    </MaxWidth>
  );
};

export default PortfolioPage;
