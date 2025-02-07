import MaxWidth from "@/components/general/MaxWidth";
import About from "@/sections/About";
import Projects from "@/sections/Projects";

const PortfolioPage = () => {
  return (
    <MaxWidth className="lg:max-w-[65rem] md:max-w-[40rem]">
      <About />
      <div className="divider" />
      <Projects />
    </MaxWidth>
  );
};

export default PortfolioPage;
