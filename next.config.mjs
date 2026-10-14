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
  images: {
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
