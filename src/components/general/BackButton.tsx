"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";

const BackButton = ({
  variant = "primary",
  showText = false,
  onClick,
  className,
  text,
}: {
  variant?: "primary" | "secondary" | "close";
  showText?: boolean;
  onClick?: () => void;
  className?: string;
  text?: string;
}) => {
  const navigate = useRouter();

  const clickHandler = () => {
    if (onClick) {
      onClick();
    } else {
      navigate.back();
    }
  };
  return (
    <Button
      variant="ghost"
      onClick={clickHandler}
      className={cn(
        "w-fit text-muted-foreground font-montserrat rounded-full !p-3 h-fit",
        className,
      )}
      type="button"
    >
      {variant === "primary" && (
        <>
          <ArrowLeft />
          {showText && (text || "Back")}
        </>
      )}
      {variant === "secondary" && (
        <>
          <ChevronLeft />
          {showText && (text || "Go Back")}
        </>
      )}
      {variant === "close" && (
        <>
          <X />
          {showText && (text || "Close")}
        </>
      )}
    </Button>
  );
};

export default BackButton;
