import { NextResponse } from "next/server";
import { AuthError, verifyAuthToken } from "@/lib/auth/verify-token";
import { getTatumNetwork } from "@/lib/deposit/constants";
import { getUserWallet, listUserDeposits } from "@/lib/deposit/firestore";

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const [wallet, deposits] = await Promise.all([
      getUserWallet(decoded.uid),
      listUserDeposits(decoded.uid),
    ]);

    return NextResponse.json({
      balances: wallet.balances,
      deposits,
      network: getTatumNetwork(),
      updatedAt: wallet.updatedAt,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("deposit status error:", error);
    return NextResponse.json({ error: "Failed to load deposit status." }, { status: 500 });
  }
}
