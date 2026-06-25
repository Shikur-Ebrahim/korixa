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

    const { privateKey, destinationAddress, amount, pin } = await req.json();

    if (!privateKey || !destinationAddress || !amount || !pin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify the Admin PIN
    const pinDoc = await db.doc(PIN_DOC_PATH).get();
    const currentPin = pinDoc.exists && pinDoc.data()?.pin ? pinDoc.data()?.pin : DEFAULT_PIN;
    if (pin !== currentPin) {
      return NextResponse.json({ error: "Invalid PIN. Withdrawal rejected." }, { status: 401 });
    }

    // 3. Execute the real blockchain transaction
    const { txId } = await sendUsdtTrc20(privateKey, destinationAddress, amount);

    // 4. Log the withdrawal
    await db.collection("admin_logs").add({
      action: "direct_wallet_withdrawal",
      adminUid: adminUser.uid,
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
    console.error("Direct withdrawal error:", error);

    // Provide a clear error message for the most common failure (gas/TRX)
    const msg = error.message || "Withdrawal failed";
    const isGasError = msg.toLowerCase().includes("resource") ||
      msg.toLowerCase().includes("bandwidth") ||
      msg.toLowerCase().includes("energy") ||
      msg.toLowerCase().includes("trx") ||
      msg.toLowerCase().includes("fee");

    return NextResponse.json({
      error: isGasError
        ? "Not enough TRX for gas fees. Send 20 TRX to the source address and try again."
        : msg
    }, { status: 500 });
  }
}
