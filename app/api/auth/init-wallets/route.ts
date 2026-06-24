import { NextResponse } from "next/server";
import { verifyAuthToken, AuthError } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const DEFAULT_ASSETS = [
  { coin: "USDT", name: "Tether US" },
  { coin: "BTC",  name: "Bitcoin" },
  { coin: "ETH",  name: "Ethereum" },
  { coin: "SOL",  name: "Solana" },
  { coin: "BNB",  name: "BNB" },
];

/**
 * POST /api/auth/init-wallets
 * Called after social sign-in (Google / Facebook) to ensure the user has
 * funding + spot wallets in Firestore. Uses Firebase Admin so it bypasses
 * client-side Firestore security rules. Safe to call multiple times — it
 * checks for existing wallets first and skips if already created.
 */
export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const uid = decoded.uid;
    const db = getAdminDb();

    // ── Check if wallets already exist ──────────────────────────────────────
    const existing = await db
      .collection("wallets")
      .where("userId", "==", uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, created: false, message: "Wallets already exist." });
    }

    // ── Create all wallets in a single batch ────────────────────────────────
    const batch = db.batch();
    const walletsRef = db.collection("wallets");
    const now = Date.now();

    for (const asset of DEFAULT_ASSETS) {
      // Funding wallet
      const fundingRef = walletsRef.doc();
      batch.set(fundingRef, {
        userId: uid,
        type: "funding",
        coin: asset.coin,
        name: asset.name,
        balance: 0,
        availableBalance: 0,
        lockedBalance: 0,
        usdValue: 0,
        change24h: 0,
      });

      // Spot wallet
      const spotRef = walletsRef.doc();
      batch.set(spotRef, {
        userId: uid,
        type: "spot",
        coin: asset.coin,
        amount: 0,
        avgBuyPrice: 0,
        updatedAt: now,
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      created: true,
      message: "Wallets initialized successfully.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("init-wallets error:", err);
    return NextResponse.json({ error: "Failed to initialize wallets." }, { status: 500 });
  }
}
