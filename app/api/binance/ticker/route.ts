import { NextResponse } from "next/server";
import { fetchBinance } from "@/lib/binance/client";
import type { BinanceTicker } from "@/lib/binance/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    const path = symbol ? `/ticker/24hr?symbol=${symbol.toUpperCase()}` : "/ticker/24hr";
    const data = await fetchBinance<BinanceTicker | BinanceTicker[]>(path);

    return NextResponse.json(data);
  } catch (error) {
    console.error("binance ticker error:", error);
    return NextResponse.json({ error: "Failed to fetch ticker." }, { status: 502 });
  }
}
