"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiX } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Dismiss stored? Don't show again for 7 days
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", String(Date.now()));
  };

  if (!showBanner || installed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[200] md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-[#161a1e]/95 backdrop-blur-md px-4 py-3.5 shadow-2xl shadow-black/40">
        {/* App icon */}
        <img
          src="/korixa-logo.jpg"
          alt="Korixa"
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">Install Korixa App</p>
          <p className="text-[10px] text-[#848e9c] mt-0.5">Faster access, works offline</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[10px] font-bold text-[#0b0e11] transition hover:bg-primary/90"
        >
          <FiDownload size={12} />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06] hover:text-white transition"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
}

// Exported hook for use in the Mobile App page
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
    return outcome === "accepted";
  };

  return { install, isInstalled, canInstall: !!deferredPrompt };
}
