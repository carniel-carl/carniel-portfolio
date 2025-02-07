import { cn } from "@/lib/utils";
import React from "react";

const MaxWidth = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className={cn(props.className, "w-[90%] max-w-[85rem] mx-auto")}
    />
  );
};

export default MaxWidth;
