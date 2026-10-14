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
