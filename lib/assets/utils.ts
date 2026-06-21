import type { BinanceTicker } from "@/lib/binance/types";
import {
  ALLOCATION_COLORS,
  getCoinMeta,
  type AllocationKey,
} from "@/lib/assets/constants";
import type { AllocationSlice, AssetHolding, PortfolioSummary } from "@/lib/assets/types";

export function formatCryptoAmount(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  if (value >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
  if (value >= 0.0001) return value.toFixed(6);
  return value.toFixed(8);
}

export function buildAssetHoldings(
  balances: Record<string, number>,
  tickerMap: Map<string, BinanceTicker>
): AssetHolding[] {
  const holdings: AssetHolding[] = [];

  for (const [symbol, amount] of Object.entries(balances)) {
    if (!amount || amount <= 0) continue;

    const meta = getCoinMeta(symbol);
    const price =
      symbol === "USDT" ? 1 : parseFloat(tickerMap.get(`${symbol}USDT`)?.lastPrice ?? "0");
    const change24h =
      symbol === "USDT"
        ? 0
        : parseFloat(tickerMap.get(`${symbol}USDT`)?.priceChangePercent ?? "0");
    const usdValue = amount * price;
    const profit24h = usdValue * (change24h / 100);

    holdings.push({
      symbol,
      name: meta.name,
      amount,
      price,
      usdValue,
      change24h,
      profit24h,
      color: meta.color,
    });
  }

  return holdings.sort((a, b) => b.usdValue - a.usdValue);
}

export function computePortfolioSummary(holdings: AssetHolding[]): PortfolioSummary {
  const totalValue = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  const profitToday = holdings.reduce((sum, h) => sum + h.profit24h, 0);
  const changePercent =
    totalValue > 0 ? holdings.reduce((sum, h) => sum + h.usdValue * h.change24h, 0) / totalValue : 0;

  return { totalValue, changePercent, profitToday };
}

export function buildAllocation(holdings: AssetHolding[]): AllocationSlice[] {
  const total = holdings.reduce((sum, h) => sum + h.usdValue, 0);
  if (total <= 0) return [];

  const buckets: Record<AllocationKey, number> = {
    BTC: 0,
    ETH: 0,
    SOL: 0,
    USDT: 0,
    Others: 0,
  };

  for (const holding of holdings) {
    const key = (["BTC", "ETH", "SOL", "USDT"] as const).includes(
      holding.symbol as "BTC" | "ETH" | "SOL" | "USDT"
    )
      ? (holding.symbol as AllocationKey)
      : "Others";
    buckets[key] += holding.usdValue;
  }

  return (Object.keys(buckets) as AllocationKey[])
    .filter((key) => buckets[key] > 0)
    .map((key) => ({
      key,
      label: key,
      value: buckets[key],
      percent: (buckets[key] / total) * 100,
      color: ALLOCATION_COLORS[key],
    }));
}

export function sortHoldings(holdings: AssetHolding[], sort: "value" | "profit" | "alpha") {
  const copy = [...holdings];
  if (sort === "value") return copy.sort((a, b) => b.usdValue - a.usdValue);
  if (sort === "profit") return copy.sort((a, b) => b.profit24h - a.profit24h);
  return copy.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function filterHoldings(holdings: AssetHolding[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return holdings;
  return holdings.filter(
    (h) => h.symbol.toLowerCase().includes(q) || h.name.toLowerCase().includes(q)
  );
}

export function isPortfolioEmpty(holdings: AssetHolding[]) {
  return holdings.length === 0 || holdings.every((h) => h.usdValue <= 0);
}
