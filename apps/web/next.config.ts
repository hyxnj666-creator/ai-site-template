import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  transpilePackages: [
    "@ai-site/ui",
    "@ai-site/ai",
    "@ai-site/db",
    "@ai-site/content",
    "@ai-site/observability",
  ],
};

export default nextConfig;
