import SkillCard from "@/components/general/SkillCard";
import { skillsData } from "@/data/skills-data";

const Skills = () => {
  return (
    <section id="skill" className="portfolio flex flex-col">
      <h2 className="heading-style after:content-['Acquired_skills'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12">
        Skills
      </h2>
      <div className="grid lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] md:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] grid-cols-[repeat(auto-fit,minmax(5rem,1fr))] gap-x-6 gap-y-8 justify-items-center">
        {skillsData.map((data) => (
          <SkillCard Icon={data.icon} key={data.title} title={data.title} />
        ))}
      </div>
    </section>
  );
};

export default Skills;
