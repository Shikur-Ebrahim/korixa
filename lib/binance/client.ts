const BINANCE_API = "https://api.binance.com/api/v3";

export async function fetchBinance<T>(path: string): Promise<T> {
  const response = await fetch(`${BINANCE_API}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3 },
  });

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
