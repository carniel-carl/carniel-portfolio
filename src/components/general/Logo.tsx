import Link from "next/link";
import React from "react";
import SVGIcon from "./SVGIcon";

const Logo = () => {
  return (
    <Link href="/" className="relative size-8 block text-accent">
      <SVGIcon width="2rem" height="2rem" />
    </Link>
  );
};

export default React.memo(Logo);
