/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Nota: 'unsafe-eval' sólo si realmente es necesario (p.ej. devtools); evitamos en prod
      isProd
        ? "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-insights.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https: https://*.public.blob.vercel-storage.com",
      "font-src 'self' data:",
      // permitir tracing/insights y APIs propias
      "connect-src 'self' https: wss: https://*.vercel-insights.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  // Configuración de imágenes
  images: {
    remotePatterns: [
      // Permitir imágenes desde Vercel Blob Storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },

  // Optimizaciones de rendimiento
  experimental: {
    // Evita que Webpack intente bundlear Prisma y use require nativo en server
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // SWC minification está habilitado por defecto en Next.js 13+

  // Bundle splitting optimizado
  webpack: (config, { dev, isServer, nextRuntime }) => {
    // Evitar que el bundle cliente en dev intente resolver módulos de Node
    if (!isServer && !nextRuntime) {
      config.resolve = config.resolve || {};
      // Alias explícitos para esquemas `node:*` que Webpack no maneja en cliente
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'node:fs': false,
        'node:fs/promises': false,
        'node:path': false,
        'node:url': false,
        'node:os': false,
        'node:module': false,
        'node:process': false,
        'node:child_process': false,
        'node:async_hooks': false,
      };
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
        url: false,
        module: false,
        process: false,
        child_process: false,
      };

      // Plugin para reportar quién está importando módulos node:* en cliente
      class NodeImportReporterPlugin {
        constructor(builtins) { this.builtins = new Set(builtins); }
        apply(compiler) {
          compiler.hooks.normalModuleFactory.tap('NodeImportReporter', (nmf) => {
            nmf.hooks.afterResolve.tap('NodeImportReporter', (data) => {
              const req = data.request || '';
              const isNodeScheme = req.startsWith('node:');
              const isBuiltin = this.builtins.has(req);
              if (isNodeScheme || isBuiltin) {
                const issuer = (data.contextInfo && (data.contextInfo.issuer || data.contextInfo.compiler)) || '';
                const from = (data.createData && data.createData.resource) || issuer || 'unknown';
                // Log explícito en consola del dev server
                // eslint-disable-next-line no-console
                console.warn(`[node-import] ${req}  importado por ${from}`);
                // Para cortar compilación inmediatamente, descomentar:
                // throw new Error(`[node-import] ${req} importado por ${from}`);
              }
            });
          });
        }
      }
      const builtins = ['fs', 'fs/promises', 'path', 'os', 'url', 'module', 'process', 'child_process'];
      config.plugins = config.plugins || [];
      config.plugins.push(new NodeImportReporterPlugin(builtins));
    }
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

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

export default withBundleAnalyzer(nextConfig);