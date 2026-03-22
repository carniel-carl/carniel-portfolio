"use client";

import { useState, useEffect } from "react";

const Footer = () => {
  const [year, setYear] = useState("");

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="md:px-16 px-8 pb-12 absolute bottom-0 inset-x-0">
      <p className=" text-xs md:text-left text-center italic text-wrap opacity-50">
        All right reserved, Nmugha Chimezie (Carniel) &copy;{year}
      </p>
    </footer>
  );
};

export default Footer;
