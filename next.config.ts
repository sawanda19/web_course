import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow cross-origin requests in development
  allowedDevOrigins: ['192.168.0.105', 'localhost'],
};

export default nextConfig;