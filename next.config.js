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
  // Remove output standalone for Vercel deployment
  // output: 'standalone', // This can cause issues with Vercel
  // Improve production performance
  poweredByHeader: false, // Remove X-Powered-By header
  // Configure compression
  compress: true,
  // Webpack configuration to handle WebGL and other issues
  webpack: (config, { isServer }) => {
    // Ignore specific warnings that might be related to WebGL
    config.ignoreWarnings = [
      { module: /node_modules\/ogl/ },
      { module: /node_modules\/@tensorflow/ },
    ];
    
    // Handle client-side only modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },
  // Experimental features for better performance
  // experimental: {
  //   optimizeCss: true,
  // },
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_WEATHER_API_KEY: process.env.NEXT_PUBLIC_WEATHER_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

module.exports = nextConfig;