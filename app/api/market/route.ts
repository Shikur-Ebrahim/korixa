import { NextResponse } from "next/server";
import { getAppMarketPageData } from "@/lib/coingecko";

export const revalidate = 1800;

export async function GET() {
  try {
    const data = await getAppMarketPageData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("market api error:", error);
    return NextResponse.json({ error: "Failed to fetch market data." }, { status: 502 });
  }
}
