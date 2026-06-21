import { NextResponse } from "next/server";
import {
  fetchAllBinanceTickers,
  fetchBinance,
  fetchBinanceTickers,
} from "@/lib/binance/client";
import { mergeTickerSymbols, PORTFOLIO_USDT_SYMBOLS } from "@/lib/binance/symbols";
import type { BinanceTicker } from "@/lib/binance/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const symbolsParam = searchParams.get("symbols");
    const all = searchParams.get("all") === "1";

    if (symbol) {
      const data = await fetchBinance<BinanceTicker>(
        `/ticker/24hr?symbol=${symbol.toUpperCase()}`
      );
      return NextResponse.json(data);
    }

    if (all) {
      try {
        const data = await fetchAllBinanceTickers();
        return NextResponse.json(data);
      } catch (error) {
        console.warn("Full ticker fetch failed, using portfolio batch:", error);
        const data = await fetchBinanceTickers([...PORTFOLIO_USDT_SYMBOLS]);
        return NextResponse.json(data);
      }
    }

    const requested = symbolsParam
      ? mergeTickerSymbols(symbolsParam.split(",").map((s) => s.replace(/USDT$/i, "")))
      : [...PORTFOLIO_USDT_SYMBOLS];

    const data = await fetchBinanceTickers(requested);
    return NextResponse.json(data);
  } catch (error) {
    console.error("binance ticker error:", error);
    return NextResponse.json({ error: "Failed to fetch ticker." }, { status: 502 });
  }
}
