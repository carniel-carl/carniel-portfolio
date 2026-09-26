"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useId, useState } from "react";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  id?: string;
  className?: string;
};

/** Chips input: Enter or comma adds, Backspace on empty removes the last. */
export default function TagInput({ value, onChange, placeholder, id, className }: TagInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const items = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items]);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
        className,
      )}
      onClick={() => document.getElementById(inputId)?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex h-7 items-center gap-1 rounded-full bg-muted pl-2.5 pr-1 text-[13px] text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((_, j) => j !== i));
            }}
            aria-label={`Remove ${tag}`}
            className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={inputId}
        value={draft}
        onChange={(e) => {
          const next = e.target.value;
          if (next.endsWith(",")) add(next);
          else setDraft(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (text.includes(",")) {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder={value.length ? "" : placeholder}
        className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
