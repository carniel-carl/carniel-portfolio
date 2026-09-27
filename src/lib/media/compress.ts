// Client-side media optimisation for the admin, so UploadThing only ever
// stores small files. Video uses mediabunny (WebCodecs, hardware encoders),
// imported lazily so it never ships to public pages.

export const VIDEO_MAX_SECONDS = 60;
const VIDEO_MAX_LONG_SIDE = 1280;
const VIDEO_BITRATE = 1_400_000;
const IMAGE_MAX_LONG_SIDE = 1600;
// Must match videoUploader's maxFileSize in app/api/uploadthing/core.ts
export const VIDEO_MAX_UPLOAD_BYTES = 16 * 1024 * 1024;

export type CompressedVideo = {
  file: File;
  poster: File | null;
  originalBytes: number;
  compressedBytes: number;
  trimmed: boolean;
};

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "file";

async function canvasToWebp(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number) {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/webp", quality });
  }
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", quality),
  );
}

/** Downscale (never upscale) and re-encode an image as WebP. */
export async function compressImage(file: File, quality = 0.82): Promise<File> {
  // GIFs/SVGs lose animation or crispness when rasterised; keep as-is
  if (/image\/(gif|svg)/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_MAX_LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasToWebp(canvas, quality);
  // Keep the original if re-encoding didn't actually help
  if (blob.size >= file.size) return file;
  return new File([blob], `${baseName(file.name)}.webp`, { type: "image/webp" });
}

export function supportsVideoCompression() {
  return typeof window !== "undefined" && "VideoEncoder" in window && "VideoDecoder" in window;
}

/**
 * Re-encode a screen recording to a small, web-friendly MP4:
 * long side <= 1280px, <= 30fps, H.264 at a low-but-clean bitrate, no audio
 * (portfolio clips play muted), trimmed to 60s, fast-start for streaming.
 * Also grabs a poster frame so visitors see an image before the video loads.
 */
export async function compressVideo(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<CompressedVideo> {
  const mb = await import("mediabunny");

  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new Error("No video track found in that file");

  const duration = await input.computeDuration();
  const trimmed = duration > VIDEO_MAX_SECONDS;

  const long = Math.max(track.displayWidth, track.displayHeight);
  const scale = Math.min(1, VIDEO_MAX_LONG_SIDE / long);
  const width = even(track.displayWidth * scale);
  const height = even(track.displayHeight * scale);

  if (!(await mb.canEncodeVideo("avc", { width, height }))) {
    throw new Error("This browser can't encode H.264 video. Try Chrome, Edge or Safari.");
  }

  const output = new mb.Output({
    format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new mb.BufferTarget(),
  });

  const conversion = await mb.Conversion.init({
    input,
    output,
    video: {
      width,
      height,
      fit: "contain",
      frameRate: 30,
      codec: "avc",
      // Fixed ~1.4 Mbps: crisp for UI at <=1280px and caps a 60s clip near
      // 10MB, safely under the 16MB upload limit even for busy recordings
      bitrate: VIDEO_BITRATE,
    },
    audio: { discard: true },
    trim: trimmed ? { start: 0, end: VIDEO_MAX_SECONDS } : undefined,
  });

  if (!conversion.isValid) {
    throw new Error("That video format can't be converted in this browser");
  }

  conversion.onProgress = (p) => onProgress(Math.min(1, p));
  await conversion.execute();

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Video conversion produced no output");
  const compressed = new File([buffer], `${baseName(file.name)}.mp4`, { type: "video/mp4" });

  // Poster: a frame ~1s in (skips black first frames), as WebP
  let poster: File | null = null;
  try {
    const sink = new mb.CanvasSink(track, { width, height, fit: "contain" });
    const frame = await sink.getCanvas(Math.min(1, duration / 2));
    if (frame) {
      const blob = await canvasToWebp(frame.canvas, 0.8);
      poster = new File([blob], `${baseName(file.name)}-poster.webp`, { type: "image/webp" });
    }
  } catch {
    // Poster is a nice-to-have; the cover image is used as a fallback
  }

  return {
    file: compressed,
    poster,
    originalBytes: file.size,
    compressedBytes: compressed.size,
    trimmed,
  };
}
