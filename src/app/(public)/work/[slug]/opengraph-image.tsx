import { getProjectBySlug } from "@/lib/data/portfolio";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

export const alt = "Case study by Chimezie Carniel";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = await getProjectBySlug(slug);

  if (!found) {
    return renderOgImage({ eyebrow: "Case study", title: "Selected work" });
  }

  const { project } = found;
  return renderOgImage({
    eyebrow: project.tag || "Case study",
    title: project.name,
    meta: [project.role || "Chimezie Carniel", ...project.stack.slice(0, 3)].filter(Boolean),
  });
}
