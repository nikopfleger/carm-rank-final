/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de imágenes
  images: {
    qualities: [25, 50, 75, 95],
    remotePatterns: [
      // Permitir imágenes desde el dominio configurado en NEXTAUTH_URL
      ...(process.env.NEXTAUTH_URL ? [{
        protocol: new URL(process.env.NEXTAUTH_URL).protocol.replace(':', ''),
        hostname: new URL(process.env.NEXTAUTH_URL).hostname,
        port: new URL(process.env.NEXTAUTH_URL).port || '',
        pathname: '/images/games/**',
      }] : []),
    ],
  },

  // Optimizaciones de rendimiento
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // SWC minification está habilitado por defecto en Next.js 13+

  // Bundle splitting optimizado
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          calculations: {
            test: /[\\/]lib[\\/]calculations/,
            name: 'calculations',
            chunks: 'all',
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;