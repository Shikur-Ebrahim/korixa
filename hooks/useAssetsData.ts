"use client";

import { useEffect, useMemo, useState } from "react";
import { loadAssetTransactions } from "@/lib/assets/transactions";
import {
  buildAllocation,
  buildAssetHoldings,
  computePortfolioSummary,
  isPortfolioEmpty,
} from "@/lib/assets/utils";
import { mergeTickerSymbols } from "@/lib/binance/symbols";
import type { BinanceTicker } from "@/lib/binance/types";
import { loadBalances } from "@/lib/trade/storage";
import { useBinanceTickers } from "@/hooks/useBinanceMarket";

export function useAssetsData() {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState(loadAssetTransactions());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const symbols = useMemo(
    () => mergeTickerSymbols(Object.keys(balances)),
    [balances]
  );

  const { data: tickers, isLoading, error, mutate } = useBinanceTickers(symbols);

  useEffect(() => {
    setBalances(loadBalances());
    setTransactions(loadAssetTransactions());
  }, []);

  useEffect(() => {
    if (tickers) setLastUpdated(new Date());
  }, [tickers]);

  const parsed = useMemo(() => {
    if (!tickers) return null;
    const tickerMap = new Map<string, BinanceTicker>(tickers.map((t) => [t.symbol, t]));
    const holdings = buildAssetHoldings(balances, tickerMap);
    const summary = computePortfolioSummary(holdings);
    const allocation = buildAllocation(holdings);
    return { holdings, summary, allocation, tickerMap };
  }, [balances, tickers]);

  return {
    holdings: parsed?.holdings ?? [],
    summary: parsed?.summary ?? { totalValue: 0, changePercent: 0, profitToday: 0 },
    allocation: parsed?.allocation ?? [],
    transactions,
    isEmpty: parsed ? isPortfolioEmpty(parsed.holdings) : false,
    isLoading,
    error,
    lastUpdated,
    refresh: mutate,
  };
}
