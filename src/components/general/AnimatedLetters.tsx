"use client";

import {
  letterAnimeVariant,
  staggerVariant,
} from "@/components/animations/general";
import { motion } from "framer-motion";
const AnimatedLetters = ({
  text,
  disabled = false,
}: {
  text: string;
  disabled?: boolean;
}) => {
  return (
    <motion.span
      variants={disabled ? undefined : staggerVariant}
      initial="initial"
      animate="visible"
      className="inline-block whitespace-nowrap relative overflow-hidden"
    >
      {text.split("").map((char, i) => (
        <motion.span
          custom={[i * 0.05, (text.length - i) * 0.03]}
          variants={disabled ? undefined : letterAnimeVariant}
          initial="initial"
          animate="visible"
          exit="exit"
          key={char + i}
          className="inline-block whitespace-nowrap relative"
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default AnimatedLetters;
