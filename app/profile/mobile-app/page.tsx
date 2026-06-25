"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiDownload, FiCheck, FiSmartphone, FiZap, FiBell, FiWifi } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";
import { usePWAInstall } from "@/components/pwa/PWAInstallBanner";

const FEATURES = [
  { icon: FiZap, title: "Instant Launch", desc: "Opens instantly from your home screen — no browser needed." },
  { icon: FiBell, title: "Push Notifications", desc: "Get real-time alerts for trades, orders, and account activity." },
  { icon: FiWifi, title: "Works Offline", desc: "Access your account overview even without an internet connection." },
  { icon: FiSmartphone, title: "Native Feel", desc: "Feels exactly like a native app — full screen, no browser bar." },
];

const HOW_TO_IOS = [
  "Open korixapay.com in Safari on your iPhone or iPad.",
  "Tap the Share button (the box with the arrow pointing up).",
  'Scroll down and tap "Add to Home Screen".',
  'Tap "Add" in the top right corner.',
  "Korixa will appear on your home screen like any other app.",
];

export default function MobileAppPage() {
  const router = useRouter();
  const { install, isInstalled, canInstall } = usePWAInstall();

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Mobile App</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] via-[#0f1923] to-[#0b0e11] p-6 mb-5 text-center">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <img
              src="/korixa-logo.jpg"
              alt="Korixa"
              className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover shadow-xl shadow-primary/20 ring-2 ring-primary/30"
            />
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Korixa</h1>
            <p className="text-[10px] md:text-xs text-[#848e9c] mb-5">
              Trade USDT on the go — install the app for the best experience.
            </p>

            {isInstalled ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                <FiCheck className="text-green-500" size={18} />
                <span className="text-xs md:text-sm font-bold text-green-400">App Installed!</span>
              </div>
            ) : canInstall ? (
              <button
                onClick={install}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-xs md:text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                <FiDownload size={16} />
                Install App Now
              </button>
            ) : (
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0e11]/50 px-4 py-3">
                <p className="text-[10px] md:text-xs text-[#848e9c]">
                  Follow the instructions below to install Korixa on your device.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mb-5">
          <h2 className="text-xs md:text-sm font-bold text-white mb-3 px-1">Why install the app?</h2>
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-white">{title}</p>
                  <p className="text-[10px] md:text-xs text-[#848e9c]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* iOS instructions (always shown as a fallback for Safari users) */}
        <div>
          <h2 className="text-xs md:text-sm font-bold text-white mb-3 px-1">Install on iPhone / iPad (Safari)</h2>
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 space-y-3">
            {HOW_TO_IOS.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-[10px] md:text-xs text-[#848e9c] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
