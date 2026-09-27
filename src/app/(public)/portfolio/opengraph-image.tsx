import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

export const alt = "Selected work by Chimezie Carniel";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Selected work",
    title: "Projects, process and the stack behind them",
    meta: ["Chimezie Carniel", "Web · Mobile"],
  });
}
