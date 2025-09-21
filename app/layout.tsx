import { FloatingNav } from '@/components/floating-nav';
import { Footer } from '@/components/footer';
import { ErrorBoundaryWrapper } from '@/components/providers/error-boundary-wrapper';
import { I18nProvider } from '@/components/providers/i18n-provider';
import { NotificationProvider } from '@/components/providers/notification-provider';
import { ServicesProvider } from '@/components/providers/services-provider';
import AuthSessionProvider from '@/components/providers/session-provider';
import { PageContainer } from '@/components/shared/page-container';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import React from "react";
import "./globals.css";

// Removido: export const dynamic = 'force-dynamic';
// Removido: export const revalidate = 0;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "CAMR Rank",
  description: "Rank del CAMR - Club Argentino de Riichi Mahjong",
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
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/carm-logo.png',
    },
  },
  openGraph: {
    title: "CAMR Rank",
    description: "Sistema de ranking del Club Argentino de Riichi Mahjong",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    siteName: "CAMR Rank",
    images: [
      {
        url: '/carm-logo.png',
        width: 800,
        height: 600,
        alt: 'CARM Logo',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CAMR Rank",
    description: "Sistema de ranking del Club Argentino de Riichi Mahjong",
    images: ['/carm-logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <I18nProvider>
          <AuthSessionProvider>
            <ServicesProvider>
              <NotificationProvider>
                <ErrorBoundaryWrapper>
                  <FloatingNav />
                  <main className="min-h-screen pb-20 relative z-10">
                    <PageContainer>
                      {children}
                    </PageContainer>
                  </main>

                  {/* Preload de rutas críticas para mejor performance */}
                  <div style={{ display: 'none' }}>
                    <Link href="/admin/abm/players" prefetch={true} />
                    <Link href="/admin/abm/games" prefetch={true} />
                    <Link href="/admin/games" prefetch={true} />
                  </div>
                  <Footer />
                </ErrorBoundaryWrapper>
              </NotificationProvider>
            </ServicesProvider>
          </AuthSessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
