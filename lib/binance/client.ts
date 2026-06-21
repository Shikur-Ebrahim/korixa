import type { BinanceTicker } from "@/lib/binance/types";
import { PORTFOLIO_USDT_SYMBOLS } from "@/lib/binance/symbols";

const PRIMARY_API =
  process.env.BINANCE_API_URL?.replace(/\/$/, "") ??
  "https://data-api.binance.vision/api/v3";

const FALLBACK_API = "https://api.binance.com/api/v3";

async function fetchFromBase<T>(baseUrl: string, path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} (${baseUrl})`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBinance<T>(path: string): Promise<T> {
  try {
    return await fetchFromBase<T>(PRIMARY_API, path);
  } catch (primaryError) {
    console.warn("Binance primary API failed, trying fallback:", primaryError);
    return fetchFromBase<T>(FALLBACK_API, path);
  }
}

export async function fetchBinanceTickers(symbols: string[]): Promise<BinanceTicker[]> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))].filter(Boolean);

  if (unique.length === 0) {
    return fetchBinanceTickers([...PORTFOLIO_USDT_SYMBOLS]);
  }

  if (unique.length === 1) {
    const single = await fetchBinance<BinanceTicker>(`/ticker/24hr?symbol=${unique[0]}`);
    return [single];
  }

  const param = encodeURIComponent(JSON.stringify(unique));
  const data = await fetchBinance<BinanceTicker[] | BinanceTicker>(
    `/ticker/24hr?symbols=${param}`
  );

  return Array.isArray(data) ? data : [data];
}

export async function fetchAllBinanceTickers(): Promise<BinanceTicker[]> {
  const data = await fetchBinance<BinanceTicker[]>("/ticker/24hr");
  return Array.isArray(data) ? data : [];
}
