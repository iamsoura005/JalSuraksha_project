import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable react strict mode for development
  reactStrictMode: true,
  // Remove swcMinify as it's not valid in this version
  // Configure image optimization
  images: {
    domains: [],
  },
  // Configure Turbopack properly for Vercel
  experimental: {
    turbo: {
      rules: {
        "*.jsx": {
          loaders: ["builtin:swc-loader"],
          as: "jsx",
        },
      },
    },
  },
};

export default nextConfig;