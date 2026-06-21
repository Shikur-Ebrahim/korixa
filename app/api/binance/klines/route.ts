import { NextResponse } from "next/server";
import { fetchBinance } from "@/lib/binance/client";
import type { BinanceKline } from "@/lib/binance/types";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTCUSDT";
    const interval = searchParams.get("interval") ?? "1h";
    const limit = searchParams.get("limit") ?? "24";

    const data = await fetchBinance<BinanceKline[]>(
      `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    const closes = data.map((row) => parseFloat(row[4]));
    return NextResponse.json({ symbol, closes });
  } catch (error) {
    console.error("binance klines error:", error);
    return NextResponse.json({ error: "Failed to fetch klines." }, { status: 502 });
  }
}
