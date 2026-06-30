import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getRoleFromToken } from "@/lib/auth/get-role";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const db = getAdminDb();
    const snapshot = await db.collection("manualCryptoDeposits")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .get();
      
    const deposits: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Fetch user details for each deposit
    for (const dep of deposits) {
      const userSnap = await db.collection("users").doc(dep.userId).get();
      if (userSnap.exists) {
        dep.userEmail = userSnap.data()?.email;
      }
    }
    
    return NextResponse.json(deposits);
  } catch (error) {
    console.error("Failed to fetch crypto deposits", error);
    return NextResponse.json({ error: "Failed to load deposits" }, { status: 500 });
  }
}
