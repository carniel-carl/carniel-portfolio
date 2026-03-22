import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import SVGIcon from "./SVGIcon";

const Logo = ({
  className,
  size = "2rem",
}: {
  className?: string;
  size?: string;
}) => {
  return (
    <Link
      href="/"
      className={cn(
        "relative size-8 flex items-center justify-center text-accent",
        className,
      )}
    >
      <SVGIcon width={size} height={size} />
      <span className="sr-only">Home</span>
    </Link>
  );
};

export default React.memo(Logo);
