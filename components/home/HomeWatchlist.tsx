"use client";

import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

export type WatchlistItem = {
  symbol: string;
  pair: string;
  price: number;
  change24h: number;
};

type HomeWatchlistProps = {
  items: WatchlistItem[];
  loading?: boolean;
};

export function HomeWatchlist({ items, loading }: HomeWatchlistProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={appTheme.sectionTitle}>Watchlist</h2>
        <Link href="/market" className={`flex items-center gap-1 ${appTheme.linkMuted}`}>
          Markets <FiArrowUpRight />
        </Link>
      </div>

      <div className={`${appTheme.card} divide-y divide-white/[0.06] p-0`}>
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse justify-between px-4 py-3.5">
              <div className="h-4 w-16 rounded bg-white/5" />
              <div className="h-4 w-24 rounded bg-white/5" />
            </div>
          ))}

        {!loading && items.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-[#848e9c]">
            No watchlist coins yet. Star pairs on the Trade page.
          </p>
        )}

        {!loading &&
          items.map((item) => {
            const up = item.change24h >= 0;
            return (
              <Link
                key={item.pair}
                href="/trade"
                className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.02]"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.symbol}</p>
                  <p className="text-[11px] text-[#848e9c]">USDT</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatUsd(item.price)}</p>
                  <p className={`text-[11px] font-medium ${up ? appTheme.positive : appTheme.negative}`}>
                    {formatPercent(item.change24h)}
                  </p>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
