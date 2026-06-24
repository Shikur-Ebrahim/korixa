"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { mergeTickerSymbols } from "@/lib/binance/symbols";
import type { BinanceDepth, BinanceTicker, BinanceTrade } from "@/lib/binance/types";

function usePollingJson<T>(url: string | null, intervalMs: number) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!url) return;

    try {
      const res = await fetch(url);
      const json = (await res.json()) as T & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Request failed");
      }
      setData(json);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Request failed"));
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    setIsLoading(true);
    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, intervalMs]);

  return { data, error, isLoading, mutate: refresh };
}

export function useBinanceTicker(symbol: string) {
  return usePollingJson<BinanceTicker>(`/api/binance/ticker?symbol=${symbol}`, 5000);
}

export function useBinanceTickers(symbols?: string[], all = false) {
  const url = all
    ? "/api/binance/ticker?all=1"
    : symbols?.length
      ? `/api/binance/ticker?symbols=${symbols.join(",")}`
      : "/api/binance/ticker";

  return usePollingJson<BinanceTicker[]>(url, 3000);
}

export function useBinanceDepth(symbol: string) {
  return usePollingJson<BinanceDepth>(
    `/api/binance/depth?symbol=${symbol}&limit=15`,
    2000
  );
}

export function useBinanceTrades(symbol: string) {
  return usePollingJson<BinanceTrade[]>(
    `/api/binance/trades?symbol=${symbol}&limit=25`,
    3000
  );
}

export function useMarketHighlights() {
  const { data, error, isLoading } = useBinanceTickers(undefined, true);

  const highlights = data
    ? (() => {
        const usdt = data.filter((t) => t.symbol.endsWith("USDT"));
        const sorted = [...usdt].sort(
          (a, b) => parseFloat(b.priceChangePercent) - parseFloat(a.priceChangePercent)
        );
        return {
          gainers: sorted.slice(0, 3),
          losers: sorted.slice(-3).reverse(),
          trending: sorted
            .slice()
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 3),
        };
      })()
    : null;

  return { highlights, error, isLoading };
}

export function useBinanceKlines(symbol: string, interval = "1h", limit = 24) {
  return usePollingJson<{ symbol: string; closes: number[] }>(
    `/api/binance/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
    60000
  );
}

export function buildWatchlist(
  tickerMap: Map<string, BinanceTicker>,
  symbols: string[]
) {
  return symbols.map((symbol) => {
    const t = tickerMap.get(symbol);
    const base = symbol.replace("USDT", "");
    return {
      symbol: base,
      pair: symbol,
      price: parseFloat(t?.lastPrice ?? "0"),
      change24h: parseFloat(t?.priceChangePercent ?? "0"),
    };
  });
}

export function computeUserBalance(
  balances: Record<string, number>,
  tickerMap: Map<string, BinanceTicker>
) {
  let total = 0;
  let weightedChangeSum = 0;

  for (const [asset, amount] of Object.entries(balances)) {
    if (!amount || amount <= 0) continue;

    if (asset === "USDT") {
      total += amount;
      continue;
    }

    const t = tickerMap.get(`${asset}USDT`);
    const price = parseFloat(t?.lastPrice ?? "0");
    const change = parseFloat(t?.priceChangePercent ?? "0");
    const value = amount * price;
    total += value;
    weightedChangeSum += value * change;
  }

  return {
    total,
    weightedChange: total > 0 ? weightedChangeSum / total : 0,
  };
}

export function useHomeMarketData(balances?: Record<string, number>) {
  const symbols = useMemo(
    () => (balances ? mergeTickerSymbols(Object.keys(balances)) : undefined),
    [balances]
  );
  const { data: tickers, isLoading, error } = useBinanceTickers(symbols);
  const { data: klines, isLoading: klinesLoading } = useBinanceKlines("BTCUSDT", "1h", 24);

  const parsed = tickers
    ? (() => {
        const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));
        const btc = tickerMap.get("BTCUSDT");
        const eth = tickerMap.get("ETHUSDT");

        return {
          tickerMap,
          btcPrice: parseFloat(btc?.lastPrice ?? "0"),
          btcChange: parseFloat(btc?.priceChangePercent ?? "0"),
          ethPrice: parseFloat(eth?.lastPrice ?? "0"),
          ethChange: parseFloat(eth?.priceChangePercent ?? "0"),
          chartCloses: klines?.closes ?? [],
        };
      })()
    : null;

  return {
    data: parsed,
    isLoading: isLoading || klinesLoading,
    error,
  };
}
