import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "KorixaPay — International Crypto Payment Platform",
  description:
    "Get an internationally accepted virtual card for seamless global payments. Instantly exchange and trade currencies from anywhere in the world.",
  keywords: [
    "crypto payment",
    "international payment",
    "virtual card",
    "global payments",
    "USDT deposit",
    "Bitcoin withdrawal",
    "P2P trading",
    "crypto to ETB",
    "Ethiopia crypto exchange",
    "digital assets",
    "crypto wallet",
    "KorixaPay",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://korixapay.com"),
  alternates: {
    canonical: "https://korixapay.com",
  },
  openGraph: {
    title: "KorixaPay — Global Payments & Crypto Exchange",
    description:
      "Get an internationally accepted virtual card for seamless global payments. Instantly exchange and trade currencies from anywhere in the world.",
    url: "https://korixapay.com",
    siteName: "KorixaPay",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KorixaPay — Global Payments & Crypto Exchange",
    description:
      "Get an internationally accepted virtual card for seamless global payments. Instantly exchange and trade currencies from anywhere in the world.",
  },
  icons: {
    icon: "/korixa-logo.jpg",
    apple: "/korixa-logo.jpg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "KorixaPay",
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
