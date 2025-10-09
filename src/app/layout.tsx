import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { PWAInstaller } from "@/components/pwa-installer";

import { ConditionalHeader } from "@/components/layout/conditional-header";
import ProgressBar from "@/components/ProgressBar";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { Suspense } from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PAJO PHARMA",
  description: "Système de gestion de pharmacie",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PAJO PHARMA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <Suspense>
              <ProgressBar />
            </Suspense>
            <ConditionalHeader />
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <PWAInstaller />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}

