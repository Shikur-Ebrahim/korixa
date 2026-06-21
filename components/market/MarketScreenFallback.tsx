"use client";

import { appTheme } from "@/components/layout/app-theme";

export function MarketScreenFallback() {
  return (
    <div className="space-y-4">
      <div className={appTheme.card}>
        <h2 className="text-base font-semibold text-white">Markets unavailable</h2>
        <p className="mt-2 text-sm text-[#848e9c]">
          Could not load live market data. Check your CoinGecko API key in{" "}
          <code className="text-primary">.env</code> and try again in a few minutes.
        </p>
      </div>
    </div>
  );
}
