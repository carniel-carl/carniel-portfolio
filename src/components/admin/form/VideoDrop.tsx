"use client";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import {
  VIDEO_MAX_SECONDS,
  VIDEO_MAX_UPLOAD_BYTES,
  compressImage,
  compressVideo,
  formatBytes,
  supportsVideoCompression,
} from "@/lib/media/compress";
import { cn } from "@/lib/utils";
import { Film, Link2, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type Phase = "idle" | "optimising" | "uploading";

/**
 * App preview video. The recording is re-encoded in the browser before it is
 * uploaded (see lib/media/compress), and a poster frame is uploaded with it.
 */
export default function VideoDrop({
  value,
  onChange,
  onPoster,
}: {
  value: string;
  onChange: (url: string) => void;
  onPoster: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const video = useUploadThing("videoUploader", { onUploadProgress: setProgress });
  const image = useUploadThing("imageUploader");

  const handle = async (files: FileList | null) => {
    const original = files?.[0];
    if (!original) return;
    if (!original.type.startsWith("video/")) {
      toast.error("That file is not a video");
      return;
    }

    try {
      let toUpload = original;
      let poster: File | null = null;

      if (supportsVideoCompression()) {
        setPhase("optimising");
        setProgress(0);
        const result = await compressVideo(original, (p) => setProgress(Math.round(p * 100)));
        toUpload = result.file;
        poster = result.poster;
        setSaving(`${formatBytes(result.originalBytes)} → ${formatBytes(result.compressedBytes)}`);
        if (result.trimmed) toast.info(`Trimmed to the first ${VIDEO_MAX_SECONDS} seconds`);
      } else if (original.size > VIDEO_MAX_UPLOAD_BYTES) {
        toast.error("This browser can't optimise video. Use Chrome, Edge or Safari, or a file under 16MB.");
        return;
      }

      if (toUpload.size > VIDEO_MAX_UPLOAD_BYTES) {
        toast.error(`Still ${formatBytes(toUpload.size)} after optimising. Try a shorter clip.`);
        return;
      }

      setPhase("uploading");
      setProgress(0);
      const [videoRes, posterRes] = await Promise.all([
        video.startUpload([toUpload]),
        poster ? image.startUpload([await compressImage(poster)]) : Promise.resolve(undefined),
      ]);

      const url = videoRes?.[0]?.ufsUrl;
      if (!url) throw new Error("Upload failed");
      onChange(url);
      const posterUrl = posterRes?.[0]?.ufsUrl;
      if (posterUrl) onPoster(posterUrl);
      toast.success("Video optimised and uploaded");
    } catch (err) {
      toast.error((err as Error).message || "Could not process that video");
    } finally {
      setPhase("idle");
      setProgress(0);
    }
  };

  const busy = phase !== "idle";

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />

      {value && !busy ? (
        <div className="space-y-2">
          <div className="group relative mx-auto aspect-[9/16] max-h-80 overflow-hidden rounded-2xl border bg-black">
            <video src={value} className="h-full w-full object-contain" muted loop playsInline controls preload="metadata" />
          </div>
          {saving && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Optimised {saving}
            </p>
          )}
          <div className="flex justify-center gap-2">
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-full hover:bg-muted" onClick={() => fileRef.current?.click()}>
              <RefreshCw className="size-3.5" />
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onChange("");
                onPoster("");
                setSaving(null);
              }}
            >
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
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
            handle(e.dataTransfer.files);
          }}
          className={cn(
            "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            dragging ? "border-accent-ink bg-primary/10" : "hover:border-foreground/30 hover:bg-muted/60",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="tnum text-sm text-muted-foreground">
                {phase === "optimising" ? `Optimising ${progress}%` : `Uploading ${progress}%`}
              </span>
              <span className="text-xs text-muted-foreground">
                {phase === "optimising" ? "Compressing in your browser, keep this tab open" : "Almost there"}
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-accent-ink transition-transform duration-300"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </>
          ) : (
            <>
              <span className="grid size-10 place-items-center rounded-full bg-card shadow-sm ring-1 ring-border">
                <Film className="size-[18px]" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {dragging ? "Drop to optimise" : "Drop a screen recording or click to browse"}
              </span>
              <span className="text-xs text-muted-foreground">
                Any size. Compressed to a small MP4 before upload, up to {VIDEO_MAX_SECONDS}s.
              </span>
            </>
          )}
        </button>
      )}

      {showUrl ? (
        <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <Link2 className="ml-3 size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://.../preview.mp4"
            aria-label="Video URL"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrl(true)}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Use a video URL instead (e.g. Cloudinary)
        </button>
      )}
    </div>
  );
}
