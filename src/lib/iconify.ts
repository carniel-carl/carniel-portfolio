// Iconify gives the admin picker access to thousands of brand logos without
// bundling them. Icons are searched and previewed from the public API, and a
// skill stores the resolved SVG so the site renders it with no network call.

export const ICONIFY_API = "https://api.iconify.design";

// Monochrome sets only, so every icon picks up the site's text colour
export const ICONIFY_PREFIXES = ["simple-icons", "devicon-plain", "tabler", "lucide"];

const ICON_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isIconifyId(id: string) {
  return ICON_ID.test(id);
}

export function iconifyPreviewUrl(id: string) {
  const [prefix, name] = id.split(":");
  return `${ICONIFY_API}/${prefix}/${name}.svg`;
}

export async function searchIconify(query: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    query,
    limit: "96",
    prefixes: ICONIFY_PREFIXES.join(","),
  });
  const res = await fetch(`${ICONIFY_API}/search?${params}`, { signal });
  if (!res.ok) throw new Error("Icon search failed");
  const data: { icons: string[] } = await res.json();
  return data.icons;
}

type IconifySet = {
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
};

/** Fetches an icon and returns standalone SVG markup, or throws. */
export async function fetchIconifySvg(id: string) {
  if (!isIconifyId(id)) throw new Error("Invalid icon id");
  const [prefix, name] = id.split(":");

  const res = await fetch(`${ICONIFY_API}/${prefix}.json?icons=${name}`);
  if (!res.ok) throw new Error("Icon not found");
  const set: IconifySet = await res.json();
  const icon = set.icons?.[name];
  if (!icon) throw new Error("Icon not found");

  // The markup is rendered as HTML, so refuse anything beyond plain shapes
  if (/<script|<foreignObject|\son\w+=|javascript:/i.test(icon.body)) {
    throw new Error("Icon rejected");
  }

  const width = icon.width ?? set.width ?? 16;
  const height = icon.height ?? set.height ?? 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">${icon.body}</svg>`;
}
