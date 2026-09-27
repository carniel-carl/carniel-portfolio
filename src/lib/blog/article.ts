// Server-side helpers for rendering a post: read time, heading anchors and the
// table of contents are derived from the same (already sanitised) HTML.

export type TocItem = { id: string; text: string; level: 2 | 3 };

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "section";

export function readingMinutes(html: string) {
  const words = decode(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

// Gives every h2/h3 a stable, unique id and returns the matching TOC
export function withHeadingAnchors(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const seen = new Map<string, number>();

  const out = html.replace(
    /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (_match, tag: string, attrs = "", inner: string) => {
      const text = decode(inner);
      if (!text) return _match;
      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count ? `${base}-${count + 1}` : base;
      toc.push({ id, text, level: tag.toLowerCase() === "h2" ? 2 : 3 });
      const cleanAttrs = String(attrs).replace(/\sid="[^"]*"/i, "");
      return `<${tag}${cleanAttrs} id="${id}">${inner}</${tag}>`;
    },
  );

  return { html: out, toc };
}
