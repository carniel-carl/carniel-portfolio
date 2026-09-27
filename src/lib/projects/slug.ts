// URL-safe slug for /work/[slug]. Projects saved before case studies existed
// have no stored slug, so the public site derives one from the name.
export function toSlug(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-")
      .slice(0, 60)
      .replace(/-$/, "") || "project"
  );
}

export const projectSlug = (p: { slug?: string | null; name: string }) =>
  p.slug?.trim() || toSlug(p.name);
