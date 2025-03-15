"use client";

import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import bgImage from "@/assests/images/profile-pic.jpg";

const BannerImage = () => {
  const container = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center h-[60vh] overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image
            src={bgImage}
            alt="profile"
            fill
            className="object-cover object-[15%_35%] opacity-20"
            placeholder="blur"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default BannerImage;
