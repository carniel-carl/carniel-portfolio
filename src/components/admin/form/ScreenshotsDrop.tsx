"use client";

import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/media/compress";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX = 6;

/** App screenshots: multi-upload (compressed to WebP first), reorder, remove. */
export default function ScreenshotsDrop({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { startUpload } = useUploadThing("screenshotUploader");

  const add = async (files: FileList | null) => {
    const room = MAX - value.length;
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (!picked.length) {
      if (room <= 0) toast.error(`Up to ${MAX} screenshots`);
      return;
    }
    setBusy(true);
    try {
      const compressed = await Promise.all(picked.map((f) => compressImage(f)));
      const res = await startUpload(compressed);
      const urls = (res ?? []).map((r) => r.ufsUrl).filter(Boolean);
      onChange([...value, ...urls].slice(0, MAX));
      toast.success(`${urls.length} screenshot${urls.length === 1 ? "" : "s"} added`);
    } catch (err) {
      toast.error((err as Error).message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />

      {value.length > 0 && (
        <ol className="grid grid-cols-3 gap-2">
          {value.map((url, i) => (
            <li key={url} className="group relative aspect-[9/16] overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left" className="grid size-6 place-items-center rounded-full text-white disabled:opacity-30">
                  <ChevronLeft className="size-3.5" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove screenshot ${i + 1}`} className="grid size-6 place-items-center rounded-full text-white hover:text-red-300">
                  <X className="size-3.5" />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Move right" className="grid size-6 place-items-center rounded-full text-white disabled:opacity-30">
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {value.length < MAX && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging ? "border-accent-ink bg-primary/10" : "hover:border-foreground/30 hover:bg-muted/60",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Optimising and uploading</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-4 text-muted-foreground" />
              <span className="font-medium">Add screenshots</span>
              <span className="text-xs text-muted-foreground">{value.length}/{MAX}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
