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
    const snap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();

    const users = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        uid: doc.id,
        email: d.email ?? "",
        kycStatus: d.kycStatus ?? "pending",
        role: d.role ?? "user",
        idImageUrl: d.idImageUrl ?? null,
        selfieImageUrl: d.selfieImageUrl ?? null,
        faceMatchScore: d.faceMatchScore ?? null,
        rejectionReason: d.rejectionReason ?? null,
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? "",
        updatedAt: d.updatedAt?.toDate?.()?.toISOString?.() ?? "",
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}
