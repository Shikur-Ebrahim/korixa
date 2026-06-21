"use client";

import { loadTradeHistory } from "@/lib/trade/storage";
import type { AssetTransaction, AssetTransactionStatus } from "@/lib/assets/types";

const TX_KEY = "korixa-asset-transactions";

const SEED_TRANSACTIONS: AssetTransaction[] = [
  {
    id: "seed-deposit-1",
    type: "deposit",
    coin: "USDT",
    amount: 10000,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: "seed-deposit-2",
    type: "deposit",
    coin: "BTC",
    amount: 0.05,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: "seed-transfer-1",
    type: "transfer",
    coin: "ETH",
    amount: 0.5,
    status: "completed",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

function loadWalletTransactions(): AssetTransaction[] {
  if (typeof window === "undefined") return SEED_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(TX_KEY);
    if (!raw) {
      localStorage.setItem(TX_KEY, JSON.stringify(SEED_TRANSACTIONS));
      return SEED_TRANSACTIONS;
    }
    return JSON.parse(raw) as AssetTransaction[];
  } catch {
    return SEED_TRANSACTIONS;
  }
}

function mapTradeToTransaction(trade: {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  createdAt: string;
}): AssetTransaction {
  const base = trade.symbol.replace("USDT", "");
  return {
    id: trade.id,
    type: trade.side,
    coin: base,
    amount: trade.amount,
    status: "completed" as AssetTransactionStatus,
    date: trade.createdAt,
  };
}

export function loadAssetTransactions(): AssetTransaction[] {
  const wallet = loadWalletTransactions();
  const trades = loadTradeHistory().map(mapTradeToTransaction);
  return [...wallet, ...trades].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
