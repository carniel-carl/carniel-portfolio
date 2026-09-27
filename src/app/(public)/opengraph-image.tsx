import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

// Home page card
export const alt = "Chimezie Carniel, web and mobile developer";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Portfolio",
    title: "Web & mobile apps, built to feel fast",
    meta: ["Chimezie Carniel", "React · Next.js · React Native"],
  });
}
