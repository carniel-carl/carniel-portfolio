"use client";

import { letterAnimeVariant } from "@/components/animations/general";
import { motion } from "framer-motion";
const AnimatedLetters = ({
  text,
  disabled = false,
}: {
  text: string;
  disabled?: boolean;
}) => {
  return (
    <>
      {text.split("").map((char, i) => (
        <motion.span
          custom={[i * 0.05, (text.length - i) * 0.03]}
          variants={disabled ? undefined : letterAnimeVariant}
          initial="initial"
          animate="visible"
          exit="exit"
          key={char + i}
        >
          {char}
        </motion.span>
      ))}
    </>
  );
};

export default AnimatedLetters;
