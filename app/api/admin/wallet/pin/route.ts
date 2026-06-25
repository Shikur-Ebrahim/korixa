import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

// We'll store the PIN in a single document: settings/admin_wallet
const PIN_DOC_PATH = "settings/admin_wallet";
const DEFAULT_PIN = "123456";

export async function POST(req: Request) {
  try {
    const adminUser = await verifyAuthToken(req);
    const db = getAdminDb();
    
    // Ensure caller is admin
    const adminDoc = await db.doc(`users/${adminUser.uid}`).get();
    if (adminDoc.data()?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, pin, newPin } = await req.json();

    const pinDoc = await db.doc(PIN_DOC_PATH).get();
    const currentPin = pinDoc.exists && pinDoc.data()?.pin ? pinDoc.data()?.pin : DEFAULT_PIN;

    if (action === "verify") {
      if (pin === currentPin) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ success: false, error: "Invalid PIN" }, { status: 401 });
      }
    } else if (action === "update") {
      // Must provide correct current pin to update to a new one
      if (pin === currentPin) {
        if (!newPin || newPin.length < 4) {
          return NextResponse.json({ error: "New PIN must be at least 4 characters" }, { status: 400 });
        }
        await db.doc(PIN_DOC_PATH).set({ pin: newPin }, { merge: true });
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ success: false, error: "Invalid current PIN" }, { status: 401 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    console.error("Error managing PIN:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
