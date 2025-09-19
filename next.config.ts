import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable react strict mode for development
  reactStrictMode: true,
  // Configure image optimization
  images: {
    domains: [],
  },
};

export default nextConfig;