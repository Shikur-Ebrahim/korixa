/** Common USDT pairs for portfolio, home, and assets (avoids 2MB full ticker on Vercel) */
export const PORTFOLIO_USDT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "DOTUSDT",
  "MATICUSDT",
  "LTCUSDT",
  "TRXUSDT",
  "ATOMUSDT",
  "UNIUSDT",
] as const;

export function toUsdtSymbol(asset: string): string {
  const upper = asset.toUpperCase();
  if (upper.endsWith("USDT")) return upper;
  return `${upper}USDT`;
}

export function mergeTickerSymbols(bases: string[]): string[] {
  const fromBalances = bases
    .filter((asset) => asset.toUpperCase() !== "USDT")
    .map(toUsdtSymbol);

  return [...new Set([...PORTFOLIO_USDT_SYMBOLS, ...fromBalances])];
}
