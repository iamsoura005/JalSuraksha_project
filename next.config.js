/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Enable react strict mode for development
  reactStrictMode: true,
  // Configure image optimization
  images: {
    domains: [],
    unoptimized: true, // Helps with static exports
  },
  // Improve static file handling
  output: 'standalone', // Optimized for production deployments
  // Improve production performance
  poweredByHeader: false, // Remove X-Powered-By header
  // Configure compression
  compress: true,
  // Webpack configuration to handle WebGL
  webpack: (config) => {
    // Ignore specific warnings that might be related to WebGL
    config.ignoreWarnings = [
      { module: /node_modules\/ogl/ },
    ];
    return config;
  },
};

module.exports = nextConfig;