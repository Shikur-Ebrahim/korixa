import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTronUsdtBalance } from "@/lib/deposit/tron";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const addressRef = db.doc(`users/${user.uid}/deposit_addresses/TRC20`);
    const addressSnap = await addressRef.get();

    if (!addressSnap.exists) {
      return NextResponse.json({ error: "No address found" }, { status: 404 });
    }

    const data = addressSnap.data();
    const address = data?.address;
    const processedBalance = data?.processedBalance || 0;

    // Fetch real balance from TRON blockchain
    const currentBalance = await getTronUsdtBalance(address);

    if (currentBalance > processedBalance) {
      // New deposit arrived!
      const difference = currentBalance - processedBalance;

      // Credit user's wallet
      const walletRef = db.doc(`users/${user.uid}/wallet/default`);
      await walletRef.set({
        balances: {
          USDT: FieldValue.increment(difference)
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // Update processed balance so we don't credit twice
      await addressRef.update({
        processedBalance: currentBalance,
        lastDepositAt: new Date().toISOString()
      });

      // Record transaction
      await db.collection(`users/${user.uid}/transactions`).add({
        type: "deposit",
        asset: "USDT",
        amount: difference,
        status: "completed",
        timestamp: new Date().toISOString(),
        chain: "TRC20",
        address: address,
      });

      return NextResponse.json({
        newDeposit: true,
        amountAdded: difference,
        totalBalance: currentBalance,
      });
    }

    return NextResponse.json({
      newDeposit: false,
      totalBalance: currentBalance,
    });
  } catch (error) {
    console.error("Error checking TRON balance:", error);
    return NextResponse.json({ error: "Failed to check balance" }, { status: 500 });
  }
}
