import { NextResponse } from "next/server";
import { fetchBinance } from "@/lib/binance/client";
import type { BinanceDepth } from "@/lib/binance/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "BTCUSDT";
    const limit = searchParams.get("limit") ?? "15";

    const data = await fetchBinance<BinanceDepth>(
      `/depth?symbol=${symbol}&limit=${limit}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("binance depth error:", error);
    return NextResponse.json({ error: "Failed to fetch order book." }, { status: 502 });
  }
}
