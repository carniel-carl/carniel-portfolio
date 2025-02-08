"use client";
import { staggerContainer } from "@/components/animations/portfolio-page";
import { featuredProjectData } from "@/data/project-data";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

type FeatureProjectCardType = {
  data: {
    name: string;
    img: string;
    live: string;
    code: string;
    description: string;
    stack: string[];
  };
  variant: "left" | "right";
};

const Projects = () => {
  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      id="projects"
      className="portfolio flex flex-col"
    >
      <h2 className="heading-style after:content-['Explore_my_works'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12">
        Projects
      </h2>
      <div className="space-y-32">
        {featuredProjectData.map((project, index) => {
          const variant = index % 2 === 0 ? "left" : "right";
          return (
            <FeaturedProjectCard
              key={project.name}
              data={project}
              variant={variant}
            />
          );
        })}
      </div>
      {/* <div className="h-[30rem]"></div> */}
    </motion.section>
  );
};

const FeaturedProjectCard = ({ data, variant }: FeatureProjectCardType) => {
  const isRight = variant === "right";
  return (
    <div
      className={cn(
        "grid grid-cols-[35rem_1fr] items-center",
        isRight ? "grid-cols-[1fr_35rem]" : ""
      )}
    >
      <div
        className={cn(
          "flex flex-col relative -right-[1.5rem] z-[3]",
          isRight ? "right-[1.5rem] order-2  text-right" : ""
        )}
      >
        <h3 className="text-xl font-semibold">{data.name}</h3>
        <p className="p-4 dark:bg-neutral-900 bg-neutral-300 rounded-md shadow-lg mt-10 mb-4 text-foreground font-medium">
          {data.description}
        </p>
        <ul
          className={cn(
            "flex flex-wrap gap-x-8 gap-y-2 opacity-90 list-disc pl-5 disc ",
            isRight ? "justify-end" : ""
          )}
        >
          {data.stack?.map((item) => (
            <li
              key={item}
              className="capitalize marker:text-accent text-sm font-normal"
            >
              {item}
            </li>
          ))}
        </ul>
        <div>live</div>
      </div>
      <div>
        <div className="relative w-full h-[20rem] group">
          {/* <div className="w-full h-full absolute inset-0 bg-accent z-[2] rounded-md opacity-10 group-hover:opacity-0 duration-300 transition-opacity ease-in-out" /> */}
          <Image
            src={data.img}
            alt={data.name}
            fill
            className="object-cover rounded-md filter grayscale brightness-10 group-hover:filter-none group-hover:brightness-10 transition duration-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Projects;
