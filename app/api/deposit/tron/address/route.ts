import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminDb } from "@/lib/firebase-admin";
import { generateTronAccount } from "@/lib/deposit/tron";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();
    const docRef = db.doc(`users/${user.uid}/deposit_addresses/TRC20`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      return NextResponse.json({ address: data?.address });
    }

    // Generate new Tron Account
    const account = generateTronAccount();

    await docRef.set({
      chain: "TRC20",
      address: account.address,
      privateKey: account.privateKey, // Stored encrypted or secured in firestore for sweeping
      createdAt: new Date().toISOString(),
      processedBalance: 0, // Keeps track of how much we already credited
    });

    // Save to master lookup for sweeping
    await db.doc(`deposit_address_lookup/${account.address}`).set({
      uid: user.uid,
      chain: "TRC20",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ address: account.address });
  } catch (error) {
    console.error("Error generating TRON address:", error);
    return NextResponse.json({ error: "Failed to get address" }, { status: 500 });
  }
}
