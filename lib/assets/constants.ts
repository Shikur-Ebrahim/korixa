export const COIN_META: Record<string, { name: string; color: string }> = {
  BTC: { name: "Bitcoin", color: "#F7931A" },
  ETH: { name: "Ethereum", color: "#627EEA" },
  SOL: { name: "Solana", color: "#9945FF" },
  USDT: { name: "Tether USD", color: "#26A17B" },
  BNB: { name: "BNB", color: "#F3BA2F" },
  XRP: { name: "XRP", color: "#346AA9" },
  ADA: { name: "Cardano", color: "#0033AD" },
  DOGE: { name: "Dogecoin", color: "#C2A633" },
  AVAX: { name: "Avalanche", color: "#E84142" },
};

export const ALLOCATION_COLORS = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  SOL: "#9945FF",
  USDT: "#26A17B",
  Others: "#848e9c",
} as const;

export type AllocationKey = keyof typeof ALLOCATION_COLORS;

export function getCoinMeta(symbol: string) {
  return COIN_META[symbol] ?? { name: symbol, color: "#848e9c" };
}
