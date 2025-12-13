import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://businesssurgerybackend-dev-fa4d.up.railway.app/api/:path*",
      },
    ];
  },
};

export default nextConfig;
