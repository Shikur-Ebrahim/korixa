import type { AllocationKey } from "@/lib/assets/constants";

export type AssetHolding = {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  usdValue: number;
  change24h: number;
  profit24h: number;
  color: string;
};

export type AllocationSlice = {
  key: AllocationKey;
  label: string;
  value: number;
  percent: number;
  color: string;
};

export type PortfolioSummary = {
  totalValue: number;
  changePercent: number;
  profitToday: number;
};

export type AssetTransactionType = "deposit" | "withdraw" | "buy" | "sell" | "transfer";

export type AssetTransactionStatus = "completed" | "pending" | "failed";

export type AssetTransaction = {
  id: string;
  type: AssetTransactionType;
  coin: string;
  amount: number;
  status: AssetTransactionStatus;
  date: string;
};

export type SortOption = "value" | "profit" | "alpha";
