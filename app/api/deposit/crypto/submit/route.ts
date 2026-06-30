import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export async function POST(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const userId = decoded.uid;
    
    const data = await request.json();
    const { amount, txId, screenshotUrl, networkId, coin } = data;

    if (!amount || !screenshotUrl || !networkId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();

    // Verify network exists
    const networkDoc = await db.collection("depositNetworks").doc(networkId).get();
    if (!networkDoc.exists) {
      return NextResponse.json({ error: "Invalid network" }, { status: 400 });
    }

    const networkData = networkDoc.data();

    if (amount < (networkData?.minDeposit || 0)) {
      return NextResponse.json({ error: `Minimum deposit is ${networkData?.minDeposit} USDT` }, { status: 400 });
    }

    // Save request
    await db.collection("manualCryptoDeposits").add({
      userId,
      amount: Number(amount),
      coin: coin || "USDT",
      networkId,
      networkName: networkData?.name,
      txId: txId || null,
      screenshotUrl,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to submit crypto deposit", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
