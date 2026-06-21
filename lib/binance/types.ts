export type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openPrice: string;
  bidPrice: string;
  askPrice: string;
};

export type BinanceDepthLevel = [string, string];

export type BinanceDepth = {
  lastUpdateId: number;
  bids: BinanceDepthLevel[];
  asks: BinanceDepthLevel[];
};

export type BinanceTrade = {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
};

export type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export type TradePair = {
  symbol: string;
  base: string;
  quote: string;
  label: string;
};

export const DEFAULT_PAIRS: TradePair[] = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", label: "BTC/USDT" },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", label: "ETH/USDT" },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", label: "SOL/USDT" },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", label: "BNB/USDT" },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", label: "XRP/USDT" },
  { symbol: "ADAUSDT", base: "ADA", quote: "USDT", label: "ADA/USDT" },
  { symbol: "DOGEUSDT", base: "DOGE", quote: "USDT", label: "DOGE/USDT" },
  { symbol: "AVAXUSDT", base: "AVAX", quote: "USDT", label: "AVAX/USDT" },
];

export type ChartInterval = "1" | "5" | "15" | "60" | "240" | "D";

export const CHART_INTERVALS: { id: ChartInterval; label: string }[] = [
  { id: "1", label: "1m" },
  { id: "5", label: "5m" },
  { id: "15", label: "15m" },
  { id: "60", label: "1h" },
  { id: "240", label: "4h" },
  { id: "D", label: "1D" },
];

export type OrderType = "market" | "limit";
export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled";

export type StoredOrder = {
  id: string;
  pair: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type StoredTrade = {
  id: string;
  pair: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  total: number;
  fee: number;
  createdAt: string;
};
