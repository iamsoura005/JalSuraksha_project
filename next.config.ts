import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      rules: {
        "*.jsx": {
          loaders: ["babel-loader"],
        },
      },
    },
  },
  // Enable react strict mode for development
  reactStrictMode: true,
  // Enable SWC minification
  swcMinify: true,
  // Configure image optimization
  images: {
    domains: [],
  },
  // Configure webpack
  webpack: (config) => {
    // Add support for webgl
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'raw-loader',
        },
      ],
    });
    
    return config;
  },
};

export default nextConfig;