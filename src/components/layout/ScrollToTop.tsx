"use client";
import React, { useCallback, useEffect, useRef } from "react";

import { FaArrowUp } from "react-icons/fa";

const ScrollToTop = () => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const pageHeight = document.body.scrollHeight;

    window.addEventListener("scroll", () => {
      const position = window.scrollY;
      if (position > pageHeight - pageHeight / 4.5) {
        document.documentElement.style.setProperty("--display", "block");
      } else {
        document.documentElement.style.setProperty("--display", "none");
      }
    });
  });

  const scrollUp = useCallback(() => {
    window.scrollTo({
      top: 0,
    });
  }, []);

  return (
    <div
      ref={scrollRef}
      className="fixed bottom-[15svh] right-[3%] animate-bounce"
      style={{ display: "var(--display)" }}
    >
      <button className="text-accent size-6" onClick={scrollUp}>
        <FaArrowUp className="w-full h-full" />
      </button>
    </div>
  );
};

export default ScrollToTop;
