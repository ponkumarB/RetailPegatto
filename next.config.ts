import type { NextConfig } from "next";

const nextConfig: any = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/knowlarity/:path*',
        destination: 'https://kpi.knowlarity.com/:path*',
      },
    ];
  },
};

export default nextConfig;
