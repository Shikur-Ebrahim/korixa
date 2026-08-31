import { NextResponse } from "next/server";
import { getRoleFromToken } from "@/src/lib/auth/get-role";
import { getAdminDb } from "@/src/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const db = getAdminDb();

    const snap = await db
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const contacts = snap.docs.map((doc: any) => {
      const d = doc.data();
      return {
        id: doc.id,
        fullName: d.fullName || "",
        country: d.country || "",
        phoneNumber: d.phoneNumber || "",
        message: d.message || "",
        status: d.status || "new",
        createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
      };
    });

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error("API Contacts error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
