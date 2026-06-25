import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korixa — Trade Smarter With Crypto",
  description:
    "Buy, sell and track digital assets with a secure and modern trading experience.",
  manifest: "/manifest.json",
  icons: {
    icon: "/korixa-logo.jpg",
    apple: "/korixa-logo.jpg",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Korixa",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <head>
        <meta name="theme-color" content="#0b0e11" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          {children}
          <PWAInstallBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
