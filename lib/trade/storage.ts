"use client";

import type { StoredOrder, StoredTrade } from "@/lib/binance/types";

const FAVORITES_KEY = "korixa-trade-favorites";
const OPEN_ORDERS_KEY = "korixa-open-orders";
const HISTORY_KEY = "korixa-trade-history";
const BALANCE_KEY = "korixa-trade-balance";

const DEFAULT_FAVORITES = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITES;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_FAVORITES));
      return DEFAULT_FAVORITES;
    }
    const parsed = JSON.parse(raw) as string[];
    return parsed.length ? parsed : DEFAULT_FAVORITES;
  } catch {
    return DEFAULT_FAVORITES;
  }
}

export function saveFavorites(symbols: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(symbols));
}

export function loadOpenOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OPEN_ORDERS_KEY);
    return raw ? (JSON.parse(raw) as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOpenOrders(orders: StoredOrder[]) {
  localStorage.setItem(OPEN_ORDERS_KEY, JSON.stringify(orders));
}

export function loadTradeHistory(): StoredTrade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StoredTrade[]) : [];
  } catch {
    return [];
  }
}

export function saveTradeHistory(trades: StoredTrade[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trades));
}

export function loadBalances(): Record<string, number> {
  if (typeof window === "undefined") return { USDT: 10000, BTC: 0.05, ETH: 1.2, SOL: 25 };
  try {
    const raw = localStorage.getItem(BALANCE_KEY);
    return raw
      ? (JSON.parse(raw) as Record<string, number>)
      : { USDT: 10000, BTC: 0.05, ETH: 1.2, SOL: 25 };
  } catch {
    return { USDT: 10000, BTC: 0.05, ETH: 1.2, SOL: 25 };
  }
}

export function saveBalances(balances: Record<string, number>) {
  localStorage.setItem(BALANCE_KEY, JSON.stringify(balances));
}
