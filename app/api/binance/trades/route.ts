import { NextResponse } from "next/server";
import { fetchBinance } from "@/lib/binance/client";
import type { BinanceTrade } from "@/lib/binance/types";

export const revalidate = 2;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTCUSDT";
    const limit = searchParams.get("limit") ?? "20";

    const data = await fetchBinance<BinanceTrade[]>(
      `/trades?symbol=${symbol}&limit=${limit}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("binance trades error:", error);
    return NextResponse.json({ error: "Failed to fetch trades." }, { status: 502 });
  }
}
