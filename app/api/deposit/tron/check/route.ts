import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { getTronUsdtBalance, getIncomingUsdtTransfers } from "@/lib/deposit/tron";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: Request) {
  try {
    const user = await verifyAuthToken(req);

    const db = getAdminDb();
    const addressRef = db.doc(`users/${user.uid}/deposit_addresses/TRC20`);
    const addressSnap = await addressRef.get();

    if (!addressSnap.exists) {
      return NextResponse.json({ error: "No address found" }, { status: 404 });
    }

    const data = addressSnap.data();
    const address = data?.address;
    const processedTxIds = data?.processedTxIds || [];

    // Fetch incoming transfers from TronGrid
    const transfers = await getIncomingUsdtTransfers(address);
    let newDepositAmount = 0;
    const newTxIds = [];

    for (const tx of transfers) {
      if (!processedTxIds.includes(tx.txId)) {
        newDepositAmount += tx.amount;
        newTxIds.push(tx.txId);
      }
    }

    if (newDepositAmount > 0) {
      // Credit user's wallet with the new incoming deposits
      const walletRef = db.doc(`users/${user.uid}/wallet/default`);
      await walletRef.set({
        balances: {
          USDT: FieldValue.increment(newDepositAmount)
        },
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // Update processed TXIDs and processed balance
      const currentBalance = await getTronUsdtBalance(address); // Just for admin display purposes
      await addressRef.update({
        processedTxIds: FieldValue.arrayUnion(...newTxIds),
        processedBalance: FieldValue.increment(newDepositAmount), // Keep track of total ever deposited
        currentBalance: currentBalance, // Store the actual on-chain balance for the Admin wallet view
        lastDepositAt: new Date().toISOString()
      });

      // Record transactions
      for (const txId of newTxIds) {
        const txInfo = transfers.find((t: any) => t.txId === txId);
        await db.collection(`users/${user.uid}/transactions`).add({
          type: "deposit",
          asset: "USDT",
          amount: txInfo?.amount || 0,
          status: "completed",
          timestamp: new Date().toISOString(),
          chain: "TRC20",
          address: address,
          txId: txId,
        });
      }

      return NextResponse.json({
        newDeposit: true,
        amountAdded: newDepositAmount,
      });
    }

    return NextResponse.json({
      newDeposit: false,
    });
  } catch (error) {
    console.error("Error checking TRON balance:", error);
    return NextResponse.json({ error: "Failed to check balance" }, { status: 500 });
  }
}
