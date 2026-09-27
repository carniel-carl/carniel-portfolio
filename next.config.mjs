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
  // Generated share images read these with fs at request time (new blog
  // posts render on demand), so make sure they ship with the function
  outputFileTracingIncludes: {
    "/**/opengraph-image*": [
      "./src/lib/og/fonts/*.ttf",
      "./public/images/favicon/web-app-manifest-192x192.png",
    ],
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
