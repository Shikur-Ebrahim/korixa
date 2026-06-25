import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collectionGroup("deposit_addresses").where("chain", "==", "TRC20").get();

    const addresses = [];
    let totalUsdt = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const uid = doc.ref.parent.parent?.id;

      // In a real production environment, you would query TronGrid for real-time balances here.
      // We stored currentBalance during the last check.
      const balance = data.currentBalance || data.processedBalance || 0;
      
      totalUsdt += balance;

      addresses.push({
        uid,
        address: data.address,
        balance: balance,
        lastDepositAt: data.lastDepositAt || data.createdAt,
      });
    }

    // Sort by balance descending
    addresses.sort((a, b) => b.balance - a.balance);

    return NextResponse.json({
      totalUsdt,
      addresses,
    });
  } catch (error) {
    console.error("Error fetching admin wallet stats:", error);
    return NextResponse.json({ error: "Failed to fetch wallet stats" }, { status: 500 });
  }
}
