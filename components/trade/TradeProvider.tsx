"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ChartInterval,
  OrderSide,
  OrderType,
  StoredOrder,
  StoredTrade,
  TradePair,
} from "@/lib/binance/types";
import { DEFAULT_PAIRS } from "@/lib/binance/types";
import {
  loadBalances,
  loadFavorites,
  loadOpenOrders,
  loadTradeHistory,
  saveBalances,
  saveFavorites,
  saveOpenOrders,
  saveTradeHistory,
} from "@/lib/trade/storage";

type TradeContextValue = {
  pair: TradePair;
  setPair: (pair: TradePair) => void;
  chartInterval: ChartInterval;
  setChartInterval: (interval: ChartInterval) => void;
  favorites: string[];
  toggleFavorite: (symbol: string) => void;
  openOrders: StoredOrder[];
  tradeHistory: StoredTrade[];
  balances: Record<string, number>;
  placeOrder: (input: {
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
  }) => void;
  cancelOrder: (id: string) => void;
};

const TradeContext = createContext<TradeContextValue | null>(null);

const FEE_RATE = 0.001;

export function TradeProvider({ children }: { children: ReactNode }) {
  const [pair, setPair] = useState<TradePair>(DEFAULT_PAIRS[0]);
  const [chartInterval, setChartInterval] = useState<ChartInterval>("60");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [openOrders, setOpenOrders] = useState<StoredOrder[]>([]);
  const [tradeHistory, setTradeHistory] = useState<StoredTrade[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    setFavorites(loadFavorites());
    setOpenOrders(loadOpenOrders());
    setTradeHistory(loadTradeHistory());
    setBalances(loadBalances());
  }, []);

  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      saveFavorites(next);
      return next;
    });
  }, []);

  const cancelOrder = useCallback((id: string) => {
    setOpenOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id ? { ...o, status: "cancelled" as const } : o
      );
      saveOpenOrders(next.filter((o) => o.status === "open"));
      return next.filter((o) => o.status === "open");
    });
  }, []);

  const placeOrder = useCallback(
    (input: { side: OrderSide; type: OrderType; price: number; amount: number }) => {
      const total = input.price * input.amount;
      const fee = total * FEE_RATE;
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const order: StoredOrder = {
        id,
        pair: pair.label,
        symbol: pair.symbol,
        side: input.side,
        type: input.type,
        price: input.price,
        amount: input.amount,
        total,
        status: input.type === "market" ? "filled" : "open",
        createdAt: now,
      };

      setOpenOrders((prev) => {
        if (input.type === "limit") {
          const open = [...prev, order];
          saveOpenOrders(open);
          return open;
        }
        return prev;
      });

      if (input.type === "market") {
        const trade: StoredTrade = {
          id,
          pair: pair.label,
          symbol: pair.symbol,
          side: input.side,
          price: input.price,
          amount: input.amount,
          total,
          fee,
          createdAt: now,
        };

        setTradeHistory((prev) => {
          const next = [trade, ...prev].slice(0, 50);
          saveTradeHistory(next);
          return next;
        });

        setBalances((prev) => {
          const next = { ...prev };
          const base = pair.base;
          const quote = pair.quote;

          if (input.side === "buy") {
            next[quote] = (next[quote] ?? 0) - total - fee;
            next[base] = (next[base] ?? 0) + input.amount;
          } else {
            next[base] = (next[base] ?? 0) - input.amount;
            next[quote] = (next[quote] ?? 0) + total - fee;
          }

          saveBalances(next);
          return next;
        });
      }
    },
    [pair]
  );

  const value = useMemo(
    () => ({
      pair,
      setPair,
      chartInterval,
      setChartInterval,
      favorites,
      toggleFavorite,
      openOrders,
      tradeHistory,
      balances,
      placeOrder,
      cancelOrder,
    }),
    [
      pair,
      chartInterval,
      favorites,
      toggleFavorite,
      openOrders,
      tradeHistory,
      balances,
      placeOrder,
      cancelOrder,
    ]
  );

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrade() {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error("useTrade must be used within TradeProvider");
  return ctx;
}
