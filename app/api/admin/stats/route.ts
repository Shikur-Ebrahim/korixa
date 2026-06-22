import { NextResponse } from "next/server";
import { getRoleFromToken } from "@/lib/auth/get-role";
import { getAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = getAdminDb();

    // Run all counts in parallel
    const [usersSnap, depositsSnap, pendingKycSnap] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("deposits").count().get(),
      db.collection("users").where("kycStatus", "==", "pending").count().get(),
    ]);

    const totalUsers = usersSnap.data().count;
    const totalDeposits = depositsSnap.data().count;
    const pendingKyc = pendingKycSnap.data().count;

    // Recent users (last 5)
    const recentSnap = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const recentUsers = recentSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: d.email ?? "",
        kycStatus: d.kycStatus ?? "pending",
        role: d.role ?? "user",
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? "",
      };
    });

    return NextResponse.json({
      totalUsers,
      totalDeposits,
      totalWithdrawals: 0,
      pendingKyc,
      recentUsers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
