import { ImageResponse } from "next/og";
import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

// Shared template for every generated Open Graph / Twitter card.
// Dark theme on purpose: the teal accent matches the logo and reads well
// in both light and dark feeds.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const BG = "#0c0a09";
const FG = "#f2f2f2";
const MUTED = "#8a8580";
const ACCENT = "#14aaa0";

// Static instances: the renderer can't read the variable woff2 files next/font uses
const asset = (...parts: string[]) =>
  readFile(join(process.cwd(), "src/lib/og", ...parts));

// Cached so the fs reads don't make every card render on demand
const loadAssets = async () => {
  "use cache";
  cacheLife("max");
  const [display, mono, logo] = await Promise.all([
    asset("fonts/BricolageGrotesque-Condensed-SemiBold.ttf"),
    asset("fonts/GeistMono-Medium.ttf"),
    readFile(
      join(process.cwd(), "public/images/favicon/web-app-manifest-192x192.png"),
    ),
  ]);
  return {
    display: new Uint8Array(display),
    mono: new Uint8Array(mono),
    logo: `data:image/png;base64,${logo.toString("base64")}`,
  };
};

// Long titles step down so they stay within three lines
const titleSize = (title: string) =>
  title.length <= 24 ? 132 : title.length <= 48 ? 104 : title.length <= 80 ? 80 : 64;

type OgImageProps = {
  eyebrow: string;
  title: string;
  meta?: string[];
  // Small dot beside the eyebrow, e.g. a blog category colour
  dotColor?: string;
};

// Image routes render on demand under Cache Components, so cache the PNG
// bytes by card content: each card is drawn once, and a post's card only
// re-renders when its title or category changes
export async function renderOgImage(props: OgImageProps) {
  const png = await renderPng(props);
  return new Response(png, {
    headers: {
      "Content-Type": OG_CONTENT_TYPE,
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

async function renderPng({
  eyebrow,
  title,
  meta = [],
  dotColor = ACCENT,
}: OgImageProps) {
  "use cache";
  cacheLife("max");

  const { display, mono, logo } = await loadAssets();
  const host = new URL(SITE_URL).host;

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: BG,
          backgroundImage: `radial-gradient(circle at 88% 12%, ${ACCENT}33 0%, transparent 42%)`,
          color: FG,
          fontFamily: "Mono",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={52} height={52} alt="" />
            <span style={{ fontSize: 24, color: MUTED }}>{host}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 24,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: dotColor,
              }}
            />
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Display",
            fontSize: titleSize(title),
            lineHeight: 0.95,
            // Tighter than this and the condensed glyphs collide in the renderer
            letterSpacing: "-0.015em",
            textWrap: "balance",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${FG}26`,
            paddingTop: 28,
            fontSize: 24,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            {meta.map((item, i) => (
              <div key={item} style={{ display: "flex", gap: 18 }}>
                {i > 0 && <span style={{ color: ACCENT }}>/</span>}
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div
            style={{ width: 120, height: 6, borderRadius: 999, background: ACCENT }}
          />
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Display", data: display.buffer, weight: 600, style: "normal" },
        { name: "Mono", data: mono.buffer, weight: 500, style: "normal" },
      ],
    },
  );
  return new Uint8Array(await image.arrayBuffer());
}
