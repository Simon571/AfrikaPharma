import type { NextConfig } from "next";

const isMobileBuild = process.env.MOBILE_BUILD === 'true';

// Note: We avoid setting output: 'export' inside config because this project
// contains server APIs incompatible with Next static export. Instead the
// mobile build script will run `next build` followed by `next export` which
// performs the export step after a full build.
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Mobile export configuration
  ...(isMobileBuild && {
    trailingSlash: true,
    images: {
      unoptimized: true
    },
    // Keep assetPrefix compatible
    assetPrefix: '/',
  }),
  
  // Production optimizations
  compress: true,
  
  // Security headers (disabled for mobile builds)
  ...(!isMobileBuild && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ];
    },
  }),
  
  // Image optimization (adjusted for mobile)
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    ...(isMobileBuild && { unoptimized: true }),
  },
  
  // Bundle analysis in development
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        prisma: {
          name: 'prisma',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](@prisma|prisma)[\\/]/,
          priority: 30,
        },
      };
    }
    
    return config;
  },
  
  // Environment-specific config
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
