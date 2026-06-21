import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/landing/market/ChangeBadge";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import { formatUsd } from "@/lib/format";
import type { GlobalMarketStats } from "@/lib/coingecko";

type GlobalStatsBarProps = {
  global: GlobalMarketStats;
};

export function GlobalStatsBar({ global }: GlobalStatsBarProps) {
  const capUp = global.marketCapChange24h >= 0;

  return (
    <Card className="p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-[11px] text-muted sm:text-xs">Total Market Cap</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold sm:text-lg">
              {formatUsd(global.totalMarketCap, true)}
            </span>
            <ChangeBadge value={global.marketCapChange24h} size="md" />
          </div>
        </div>

        <div>
          <p className="mb-1 text-[11px] text-muted sm:text-xs">24h Trading Volume</p>
          <span className="text-base font-bold sm:text-lg">
            {formatUsd(global.totalVolume24h, true)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted sm:text-xs">
        <span>
          Btc Dominance:{" "}
          <span className="font-medium text-foreground">
            {global.btcDominance.toFixed(1)}%
          </span>
        </span>
        <span>
          Active Assets:{" "}
          <span className="font-medium text-foreground">
            {global.activeCryptos.toLocaleString("en-US")}
          </span>
        </span>
        <span className={capUp ? "text-secondary" : "text-red-400"}>
          Market {capUp ? "up" : "down"} {Math.abs(global.marketCapChange24h).toFixed(2)}% today
        </span>
      </div>
    </Card>
  );
}
