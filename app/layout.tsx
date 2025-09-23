import { Footer } from '@/components/footer';
import CacheGate from '@/components/providers/cache-gate';
import { ClientShell } from '@/components/providers/client-shell';
import { ErrorBoundaryWrapper } from '@/components/providers/error-boundary-wrapper';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { ServicesProvider } from '@/components/providers/services-provider';
import AuthSessionProvider from '@/components/providers/session-provider';
import { PageContainer } from '@/components/shared/page-container';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";
import "./globals.css";
// Mover FloatingNav/NotificationProvider a ClientShell (Client Component)

const inter = Inter({ subsets: ["latin"] });

// Nota: evitamos forzar dynamic global; los segmentos que lo requieran lo declararán localmente

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "CARM Rank",
  description: "Rank del CARM - Club Argentino de Riichi Mahjong",
  keywords: ["mahjong", "riichi", "rank", "argentina", "carm", "club", "torneo"],
  authors: [{ name: "CARM" }],
  creator: "Club Argentino de Riichi Mahjong",
  publisher: "CARM",
  icons: {
    icon: [
      { url: '/carm-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/carm-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/carm-logo.png',
    apple: '/carm-logo.png',
    other: { rel: 'apple-touch-icon-precomposed', url: '/carm-logo.png' },
  },
  openGraph: {
    title: "CARM Rank",
    description: "Sistema de ranking del Club Argentino de Riichi Mahjong",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    siteName: "CARM Rank",
    images: [{ url: '/carm-logo.png', width: 800, height: 600, alt: 'CARM Logo' }],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CARM Rank",
    description: "Sistema de ranking del Club Argentino de Riichi Mahjong",
    images: ['/carm-logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <CacheGate>
          <I18nProvider>
            <AuthSessionProvider>
              <ServicesProvider>
                <NotificationProvider>
                  <ErrorBoundaryWrapper>
                    <ClientShell>
                      <main className="min-h-screen pb-20 relative z-10">
                        <PageContainer>{children}</PageContainer>
                      </main>
                      <Footer />
                    </ClientShell>
                  </ErrorBoundaryWrapper>
                </NotificationProvider>
              </ServicesProvider>
            </AuthSessionProvider>
          </I18nProvider>
        </CacheGate>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
