import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendUsdtTrc20, getTronUsdtBalance } from "@/lib/deposit/tron";

const PIN_DOC_PATH = "settings/admin_wallet";
const DEFAULT_PIN = "123456";

export async function POST(req: Request) {
  try {
    // 1. Verify the caller is an authenticated admin
    const adminUser = await verifyAuthToken(req);
    const db = getAdminDb();

    const adminDoc = await db.doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sourceAddress, destinationAddress, amount, pin } = await req.json();

    if (!sourceAddress || !destinationAddress || !amount || !pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify the Admin PIN before doing anything
    const pinDoc = await db.doc(PIN_DOC_PATH).get();
    const currentPin = pinDoc.exists && pinDoc.data()?.pin ? pinDoc.data()?.pin : DEFAULT_PIN;
    if (pin !== currentPin) {
      return NextResponse.json({ error: "Invalid PIN. Withdrawal rejected." }, { status: 401 });
    }

    // 3. Fetch the private key from Firestore (stored when user generated their deposit address)
    const addressSnapshot = await db
      .collectionGroup("deposit_addresses")
      .where("address", "==", sourceAddress)
      .where("chain", "==", "TRC20")
      .limit(1)
      .get();

    if (addressSnapshot.empty) {
      return NextResponse.json({ error: "Source address not found" }, { status: 404 });
    }

    const addressData = addressSnapshot.docs[0].data();
    const privateKey = addressData.privateKey;

    if (!privateKey) {
      return NextResponse.json({ error: "Private key not found for this address. Cannot withdraw." }, { status: 500 });
    }

    // 4. Verify there's enough balance
    const currentBalance = await getTronUsdtBalance(sourceAddress);
    if (amount > currentBalance) {
      return NextResponse.json({
        error: `Insufficient balance. Available: ${currentBalance.toFixed(6)} USDT`
      }, { status: 400 });
    }

    // 5. Execute the real blockchain transaction
    const { txId } = await sendUsdtTrc20(privateKey, destinationAddress, amount);

    // 6. Update the stored on-chain balance (it will now be 0 or near 0)
    const newBalance = await getTronUsdtBalance(sourceAddress);
    await addressSnapshot.docs[0].ref.update({
      currentBalance: newBalance,
      lastWithdrawnAt: new Date().toISOString(),
      lastWithdrawTxId: txId,
    });

    // 7. Log the withdrawal in the admin activity log
    await db.collection("admin_logs").add({
      action: "wallet_withdrawal",
      adminUid: adminUser.uid,
      sourceAddress,
      destinationAddress,
      amount,
      txId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      txId,
      message: `Successfully sent ${amount} USDT to ${destinationAddress}`,
    });

  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({
      error: error.message || "Withdrawal failed. Check TRX balance for gas fees."
    }, { status: 500 });
  }
}
