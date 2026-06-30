import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getTronUsdtBalance } from "@/lib/deposit/tron";

export async function GET(req: Request) {
  try {
    const adminUser = await verifyAuthToken(req);

    const db = getAdminDb();

    // Ensure caller is admin
    const adminDoc = await db.doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await db.collectionGroup("deposit_addresses").where("chain", "==", "TRC20").get();

    const addresses = [];
    let totalUsdt = 0;

    // Fetch live on-chain balances in parallel for all deposit addresses
    const liveBalancePromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const uid = doc.ref.parent.parent?.id;
      const address = data.address;

      let balance = 0;
      try {
        // Fetch live balance from TronGrid
        balance = await getTronUsdtBalance(address);
        // Update stored balance for reference
        await doc.ref.update({ currentBalance: balance, lastCheckedAt: new Date().toISOString() });
      } catch (e) {
        // Fallback to stored value if live fetch fails
        balance = data.currentBalance || data.processedBalance || 0;
        console.error(`Failed to fetch live balance for ${address}:`, e);
      }

      return {
        uid,
        address,
        balance,
        processedBalance: data.processedBalance || 0,
        lastDepositAt: data.lastDepositAt || data.createdAt,
      };
    });

    const results = await Promise.all(liveBalancePromises);

    for (const r of results) {
      totalUsdt += r.balance;
      addresses.push(r);
    }

    // Sort by balance descending
    addresses.sort((a, b) => b.balance - a.balance);

    return NextResponse.json({
      totalUsdt,
      addresses,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching admin wallet stats:", error);
    return NextResponse.json({ error: "Failed to fetch wallet stats: " + error.message }, { status: 500 });
  }
}
