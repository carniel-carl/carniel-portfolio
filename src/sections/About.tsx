import { buttonVariants } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
import React from "react";

const About = () => {
  return (
    <section
      id="about"
      className="flex md:flex-row flex-col items-center  lg:gap-x-24 md:gap-x-12 gap-y-12 md:mt-20 mt-10"
    >
      <div className="w-fit relative">
        <div className="relative lg:w-[21rem] lg:h-[28rem] md:w-[18rem]  md:h-[22rem] w-[19rem] h-[18rem] about-profile__after">
          <Image
            src="/images/profile-pic.jpg"
            alt="profile pic"
            fill
            className="object-cover rounded-2xl scale-95"
          />
        </div>
      </div>

      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="heading-style after:content-['get_to_know_me'] font-nunito after:font-montserrat self-start">
          About
        </h2>
        <p className="text-lg mb-8 mt-8 max-w-[40rem] w-full text-foreground/70 font-medium">
          I'm a passionate individual who discovered my love for coding when I
          needed a website for my Art business. Since then, I've immersed myself
          in the world of technology, continually expanding my coding skills and
          exploring the endless possibilities it offers. I find joy in bringing
          creativity and functionality together through code, making my journey
          in the tech world both fulfilling and exciting.
        </p>

        <div className="btns">
          <a
            href="CHIMEZIE RESUME.pdf"
            className={`${buttonVariants()} py-5 rounded-md`}
            download="CHIMEZIE RESUME"
            target="_blank"
          >
            <span>Download resume</span>
            <Download />
          </a>
        </div>
      </div>
    </section>
  );
};

export default About;
