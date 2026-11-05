/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  // Enables React <ViewTransition> for route changes (blog list -> post morph)
  experimental: {
    viewTransition: true,
  },
  // Hosts (besides localhost) allowed to load dev-only resources like HMR.
  // 127.0.0.1 is needed for Spotify sign-in, which rejects "localhost".
  allowedDevOrigins: ["127.0.0.1", "192.168.100.113"],
  // Prisma ships engines for every database and runtime, and all of it gets
  // traced into every server function (~100MB each). This app runs MongoDB on
  // Node, which only needs runtime/library.js plus the platform's
  // libquery_engine; dropping the rest shrinks each function to ~25MB, which
  // is what Vercel bills as Functions Storage across retained deployments.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@prisma/client/runtime/query_engine_bg.*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.*",
      "node_modules/@prisma/client/runtime/wasm-*",
      "node_modules/@prisma/client/runtime/edge*",
      "node_modules/@prisma/client/runtime/react-native.*",
      "node_modules/@prisma/client/runtime/binary.*",
      "node_modules/@prisma/client/runtime/client.*",
      "node_modules/@prisma/client/runtime/*.d.mts",
      // Engines for the build machine (e.g. a Mac); Vercel builds on Linux
      "node_modules/.prisma/client/libquery_engine-darwin*",
    ],
  },
  // The OAuth consent screen must never render inside another site's frame
  async headers() {
    return [
      {
        source: "/admin/oauth/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
  // Vercel bills one transformation per source image x width x format it
  // has to (re)generate, so keep each of those small:
  images: {
    // Uploads are immutable (a new upload gets a new URL), so a resized copy
    // never goes stale. Without this, cached copies expire after 4 hours and
    // the next visitor triggers (and is billed for) a fresh transformation.
    minimumCacheTTL: 2678400, // 31 days
    // Fewer candidate widths means fewer variants per image. Defaults are
    // 8 device + 7 image sizes (up to 3840px); 1920 covers full-width images
    // on retina laptops, and the small set covers avatars and thumbnails.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
