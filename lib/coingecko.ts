const API_BASE = "https://api.coingecko.com/api/v3";

/** 30 min cache — ~144 API calls/day, well under 10k/month limit */
export const MARKET_REVALIDATE_SECONDS = 1800;

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number;
  price: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  change1h: number | null;
  change24h: number | null;
  change7d: number | null;
  sparkline: number[];
};

export type TrendingCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number | null;
};

export type GlobalMarketStats = {
  totalMarketCap: number;
  totalVolume24h: number;
  marketCapChange24h: number;
  btcDominance: number;
  activeCryptos: number;
};

export type MarketOverviewData = {
  global: GlobalMarketStats;
  coins: MarketCoin[];
  trending: TrendingCoin[];
  topGainers: MarketCoin[];
  fetchedAt: string;
};

export type MarketCategory = {
  id: string;
  name: string;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  topCoinIds: string[];
  topCoins: { symbol: string; change24h: number | null }[];
};

export type MarketSentiment = {
  score: number;
  label: string;
  longRatio: number;
  shortRatio: number;
};

export type AppMarketPageData = MarketOverviewData & {
  categories: MarketCategory[];
  topLosers: MarketCoin[];
  newlyListed: MarketCoin[];
  sentiment: MarketSentiment;
  btcCoin: MarketCoin | null;
};

type CoinGeckoMarketRow = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number;
  current_price: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price: number[] };
};

type CoinGeckoGlobalResponse = {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_change_percentage_24h_usd: number;
    market_cap_percentage: { btc: number };
    active_cryptocurrencies: number;
  };
};

type CoinGeckoTrendingResponse = {
  coins: Array<{
    item: {
      id: string;
      symbol: string;
      name: string;
      thumb: string;
      data?: {
        price?: number;
        price_change_percentage_24h?: { usd?: number };
      };
    };
  }>;
};

type CoinGeckoCategoryRow = {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  volume_24h: number;
  top_3_coins_id: string[];
};

function getCoinGeckoHeaders(): HeadersInit {
  const apiKey = process.env.COINGECKO_API_KEY;

  return apiKey
    ? {
        "x-cg-demo-api-key": apiKey,
        Accept: "application/json",
      }
    : { Accept: "application/json" };
}

async function fetchCoinGecko<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getCoinGeckoHeaders(),
    next: { revalidate: MARKET_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

function mapMarketCoin(coin: CoinGeckoMarketRow): MarketCoin {
  return {
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    rank: coin.market_cap_rank,
    price: coin.current_price,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    high24h: coin.high_24h,
    low24h: coin.low_24h,
    change1h: coin.price_change_percentage_1h_in_currency ?? null,
    change24h: coin.price_change_percentage_24h ?? null,
    change7d: coin.price_change_percentage_7d_in_currency ?? null,
    sparkline: coin.sparkline_in_7d?.price ?? [],
  };
}

function computeSentiment(coins: MarketCoin[], globalChange24h: number): MarketSentiment {
  const sample = coins.slice(0, 50);
  const up = sample.filter((c) => (c.change24h ?? 0) > 0).length;
  const longRatio = sample.length ? Math.round((up / sample.length) * 100) : 50;
  const shortRatio = 100 - longRatio;

  const score = Math.max(0, Math.min(100, Math.round(50 + globalChange24h * 4)));
  let label = "Neutral";

  if (score <= 25) label = "Extreme Fear";
  else if (score <= 45) label = "Fear";
  else if (score <= 55) label = "Neutral";
  else if (score <= 75) label = "Greed";
  else label = "Extreme Greed";

  return { score, label, longRatio, shortRatio };
}

function mapCategory(row: CoinGeckoCategoryRow, coins: MarketCoin[]): MarketCategory {
  const topCoins = (row.top_3_coins_id ?? [])
    .map((id) => {
      const coin = coins.find((c) => c.id === id);
      return coin ? { symbol: coin.symbol, change24h: coin.change24h } : null;
    })
    .filter((item): item is { symbol: string; change24h: number | null } => item != null);

  return {
    id: row.id,
    name: row.name,
    marketCap: row.market_cap,
    marketCapChange24h: row.market_cap_change_24h,
    volume24h: row.volume_24h,
    topCoinIds: row.top_3_coins_id ?? [],
    topCoins,
  };
}

export async function getAppMarketPageData(): Promise<AppMarketPageData> {
  const [globalResponse, marketsResponse, trendingResponse, categoriesResult] =
    await Promise.all([
      fetchCoinGecko<CoinGeckoGlobalResponse>("/global"),
      fetchCoinGecko<CoinGeckoMarketRow[]>(
        "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d"
      ),
      fetchCoinGecko<CoinGeckoTrendingResponse>("/search/trending"),
      fetchCoinGecko<CoinGeckoCategoryRow[]>(
        "/coins/categories?order=market_cap_change_24h_desc"
      ).catch(() => [] as CoinGeckoCategoryRow[]),
    ]);

  const categoriesResponse = categoriesResult;

  const coins = marketsResponse.map(mapMarketCoin);
  const btcCoin = coins.find((c) => c.id === "bitcoin") ?? null;

  const ranked = [...coins].filter((c) => c.change24h != null);

  const topGainers = [...ranked]
    .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
    .slice(0, 3);

  const topLosers = [...ranked]
    .sort((a, b) => (a.change24h ?? 0) - (b.change24h ?? 0))
    .slice(0, 3);

  const newlyListed = [...coins]
    .filter((c) => c.rank >= 40 && c.volume24h > 500_000)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 15);

  const trending: TrendingCoin[] = trendingResponse.coins.slice(0, 3).map(({ item }) => ({
    id: item.id,
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    image: item.thumb,
    price: item.data?.price ?? 0,
    change24h: item.data?.price_change_percentage_24h?.usd ?? null,
  }));

  const globalChange = globalResponse.data.market_cap_change_percentage_24h_usd;

  return {
    global: {
      totalMarketCap: globalResponse.data.total_market_cap.usd,
      totalVolume24h: globalResponse.data.total_volume.usd,
      marketCapChange24h: globalChange,
      btcDominance: globalResponse.data.market_cap_percentage.btc,
      activeCryptos: globalResponse.data.active_cryptocurrencies,
    },
    coins,
    trending,
    topGainers,
    topLosers,
    newlyListed,
    categories: categoriesResponse.slice(0, 8).map((row) => mapCategory(row, coins)),
    sentiment: computeSentiment(coins, globalChange),
    btcCoin,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getMarketOverviewData(): Promise<MarketOverviewData> {
  const [globalResponse, marketsResponse, trendingResponse] = await Promise.all([
    fetchCoinGecko<CoinGeckoGlobalResponse>("/global"),
    fetchCoinGecko<CoinGeckoMarketRow[]>(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=true&price_change_percentage=1h,24h,7d"
    ),
    fetchCoinGecko<CoinGeckoTrendingResponse>("/search/trending"),
  ]);

  const coins = marketsResponse.map(mapMarketCoin);

  const topGainers = [...coins]
    .filter((coin) => coin.change24h != null)
    .sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0))
    .slice(0, 3);

  const trending: TrendingCoin[] = trendingResponse.coins.slice(0, 3).map(({ item }) => ({
    id: item.id,
    symbol: item.symbol.toUpperCase(),
    name: item.name,
    image: item.thumb,
    price: item.data?.price ?? 0,
    change24h: item.data?.price_change_percentage_24h?.usd ?? null,
  }));

  return {
    global: {
      totalMarketCap: globalResponse.data.total_market_cap.usd,
      totalVolume24h: globalResponse.data.total_volume.usd,
      marketCapChange24h: globalResponse.data.market_cap_change_percentage_24h_usd,
      btcDominance: globalResponse.data.market_cap_percentage.btc,
      activeCryptos: globalResponse.data.active_cryptocurrencies,
    },
    coins,
    trending,
    topGainers,
    fetchedAt: new Date().toISOString(),
  };
}
