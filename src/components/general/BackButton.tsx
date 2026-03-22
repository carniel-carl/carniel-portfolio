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
  size = "default",
}: {
  variant?: "primary" | "secondary" | "close";
  showText?: boolean;
  onClick?: () => void;
  className?: string;
  text?: string;
  size?: "sm" | "lg" | "default" | "icon" | null | undefined;
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
        "w-fit px-2.5 text-muted-foreground font-montserrat rounded-full",
        className,
      )}
      type="button"
      size={size}
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
