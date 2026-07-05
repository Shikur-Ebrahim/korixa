"use client";

import { useEffect } from "react";

export function useAppSizeBloat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const bloatAppSize = async () => {
      try {
        // Check if already bloated
        const cache = await caches.open("korixa-bloat");
        const existing = await cache.match("/dummy_asset.bin");
        if (existing) return; // Already downloaded

        // Fetch and cache the 35MB asset in the background to bloat the app size
        await cache.add("/dummy_asset.bin");
        console.log("App size artificially increased by 35MB via Cache API.");
      } catch (err) {
        console.error("Failed to bloat app size:", err);
      }
    };

    // Run after a short delay so we don't block the main thread during initial load
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => bloatAppSize());
      } else {
        bloatAppSize();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
}
