import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin panel, API routes and the OAuth callback have nothing to index
      disallow: ["/admin", "/api/", "/spotify/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
