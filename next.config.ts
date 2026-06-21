import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/sign-in", destination: "/sign-up", permanent: true },
      { source: "/sign-in/:path*", destination: "/sign-up", permanent: true },
      { source: "/wallet", destination: "/assets", permanent: true },
    ];
  },
};

export default nextConfig;
