import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: ["gala75.ru", "www.gala75.ru"],
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
