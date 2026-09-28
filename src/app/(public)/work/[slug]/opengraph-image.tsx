import { getProjectBySlug, getProjectSlugs } from "@/lib/data/portfolio";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og/image";

export const alt = "Case study by Chimezie Carniel";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Prerendered at build so social crawlers never wait on a cold render
export async function generateStaticParams() {
  const projects = await getProjectSlugs();
  if (!projects.length) return [{ slug: "__placeholder__" }];
  return projects.map(({ slug }) => ({ slug }));
}

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
