"use client";

import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { FileText, ImageUp, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

type FileDropProps = {
  endpoint: "imageUploader" | "documentUploader";
  value: string;
  onChange: (url: string) => void;
  /** Tailwind aspect class for the image preview, e.g. "aspect-[16/10]" */
  aspectClass?: string;
  hint?: string;
  invalid?: boolean;
  id?: string;
};

/** next.config only allow-lists Uploadthing hosts; anything else skips optimisation. */
function canOptimize(url: string) {
  return url.startsWith("/") || /^https:\/\/([^/]+\.)?(utfs\.io|ufs\.sh)\//.test(url);
}

const ACCEPT = { imageUploader: "image/*", documentUploader: "application/pdf" };

/**
 * Drag-and-drop upload with preview, progress and a URL fallback.
 * Replaces the unstyled Uploadthing button.
 */
export default function FileDrop({
  endpoint,
  value,
  onChange,
  aspectClass = "aspect-[16/10]",
  hint,
  invalid,
  id,
}: FileDropProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUrl, setShowUrl] = useState(false);
  const isImage = endpoint === "imageUploader";

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: setProgress,
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) {
        onChange(url);
        toast.success(isImage ? "Image uploaded" : "File uploaded");
      }
      setProgress(0);
    },
    onUploadError: (err) => {
      toast.error(err.message || "Upload failed");
      setProgress(0);
    },
  });

  const upload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (isImage && !file.type.startsWith("image/")) {
      toast.error("That file is not an image");
      return;
    }
    if (!isImage && file.type !== "application/pdf") {
      toast.error("Upload a PDF");
      return;
    }
    startUpload([file]);
  };

  const openPicker = () => fileRef.current?.click();

  const hiddenInput = (
    <input
      ref={fileRef}
      type="file"
      accept={ACCEPT[endpoint]}
      className="sr-only"
      tabIndex={-1}
      onChange={(e) => {
        upload(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const fileName = value ? decodeURIComponent(value.split("/").pop() ?? value) : "";

  return (
    <div className="space-y-2">
      {value && !isUploading ? (
        isImage ? (
          <div className={cn("group relative overflow-hidden rounded-lg border bg-muted", aspectClass)}>
            <Image src={value} alt="Uploaded preview" fill sizes="(max-width: 1024px) 100vw, 400px" unoptimized={!canOptimize(value)} className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
              <Button type="button" size="sm" variant="secondary" className="h-8 rounded-full" onClick={openPicker}>
                <RefreshCw className="size-3.5" />
                Replace
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 rounded-full hover:text-destructive"
                onClick={() => onChange("")}
                aria-label="Remove image"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
              <FileText className="size-4 text-muted-foreground" />
            </span>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline"
            >
              {fileName}
            </a>
            <Button type="button" size="sm" variant="outline" className="h-8 rounded-full hover:bg-muted" onClick={openPicker}>
              Replace
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onChange("")}
              aria-label="Remove file"
            >
              <Trash2 />
            </Button>
          </div>
        )
      ) : (
        <button
          type="button"
          id={inputId}
          onClick={openPicker}
          disabled={isUploading}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
          aria-invalid={invalid || undefined}
          className={cn(
            "relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed bg-muted/30 px-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isImage ? aspectClass : "py-8",
            dragging ? "border-accent-ink bg-primary/10" : "hover:border-foreground/30 hover:bg-muted/60",
            invalid && "border-destructive",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <span className="tnum text-sm text-muted-foreground">Uploading {progress}%</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-accent-ink transition-transform duration-300"
                style={{ transform: `scaleX(${progress / 100})` }}
              />
            </>
          ) : (
            <>
              <span className="grid size-10 place-items-center rounded-full bg-card shadow-sm ring-1 ring-border">
                {isImage ? <ImageUp className="size-[18px]" /> : <FileText className="size-[18px]" />}
              </span>
              <span className="text-sm font-medium text-foreground">
                {dragging ? "Drop to upload" : isImage ? "Drop an image or click to browse" : "Drop a PDF or click to browse"}
              </span>
              {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </>
          )}
        </button>
      )}

      {hiddenInput}

      {showUrl ? (
        <div className="flex h-9 items-center overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <Link2 className="ml-3 size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isImage ? "https://... or /images/..." : "https://... or /resume.pdf"}
            aria-label="File URL"
            className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrl(true)}
          className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Use a URL instead
        </button>
      )}
    </div>
  );
}
