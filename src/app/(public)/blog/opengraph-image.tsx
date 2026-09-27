import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

export const alt = "Writing by Carniel";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Writing",
    title: "Notes on building for the web and mobile",
    meta: ["By Carniel", "React · Next.js · Design"],
  });
}
