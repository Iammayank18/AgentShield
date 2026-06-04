import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@agent-shield/shared-types", "@agent-shield/ui-components"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
