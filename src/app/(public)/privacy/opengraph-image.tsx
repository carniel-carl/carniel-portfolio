import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

export const alt = "Privacy policy";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Privacy",
    title: "What this site collects, and why",
    meta: ["Chimezie Carniel"],
  });
}
