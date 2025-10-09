/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisations de build et runtime
  experimental: {
    // Utiliser Turbopack en développement (déjà configuré)
    turbo: {},
    
    // Optimiser les composants serveur
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
    
    // Optimiser le bundling
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },

  // Optimisations de compilation
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Optimisations d'images
  images: {
    // Formats d'images optimisés
    formats: ['image/webp', 'image/avif'],
    
    // Qualité par défaut
    quality: 85,
    
    // Tailles d'images communes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Optimisations de bundle
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Optimisations pour la production
    if (!dev) {
      // Optimiser les dépendances externes
      config.externals = [...(config.externals || [])];
      
      // Optimiser le splitting des chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Séparer les dépendances vendor
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000, // 244kb
            },
            
            // Séparer les utilitaires UI
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
            },
            
            // Séparer Prisma
            prisma: {
              test: /[\\/]@prisma[\\/]/,
              name: 'prisma',
              chunks: 'all',
            }
          }
        }
      };
    }

    // Optimisations pour le serveur
    if (isServer) {
      // Exclure les modules client-side du bundle serveur
      config.externals.push('canvas', 'jsdom');
    }

    return config;
  },

  // Headers de performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ]
      },
      {
        // Cache statique pour les assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  // Redirections pour les performances
  async redirects() {
    return [
      // Redirection des anciennes routes si nécessaire
    ];
  },

  // Optimisations de build
  swcMinify: true, // Utiliser le minifieur SWC (plus rapide)
  
  // Optimisations de développement
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right'
  },

  // Optimisations de production
  productionBrowserSourceMaps: false, // Désactiver les source maps en prod
  
  // Optimiser les polyfills
  reactStrictMode: true,
  
  // Configuration des variables d'environnement
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Optimisations de rendu
  poweredByHeader: false, // Supprimer le header X-Powered-By
  
  // Compression
  compress: true,
  
  // Optimisations d'output
  output: 'standalone', // Pour Docker/déploiement optimisé
};

module.exports = nextConfig;