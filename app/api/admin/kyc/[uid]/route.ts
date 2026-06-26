import { NextResponse } from "next/server";
import { getRoleFromToken } from "@/lib/auth/get-role";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ uid: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { uid } = await params;
    const body = await request.json() as { action: "approve" | "reject"; reason?: string };
    const { action, reason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'." }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const update =
      action === "approve"
        ? { kycStatus: "verified", rejectionReason: null, updatedAt: FieldValue.serverTimestamp() }
        : { kycStatus: "rejected", rejectionReason: reason ?? "Rejected by admin.", updatedAt: FieldValue.serverTimestamp() };

    await ref.update(update);

    return NextResponse.json({ ok: true, uid, kycStatus: action === "approve" ? "verified" : "rejected" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KYC update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { uid } = await params;

    const db = getAdminDb();
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Completely wipe all KYC data
    const update = {
      kycStatus: "pending",
      idImageUrl: FieldValue.delete(),
      selfieImageUrl: FieldValue.delete(),
      extractedIdData: FieldValue.delete(),
      faceMatchScore: FieldValue.delete(),
      faceMatchDistance: FieldValue.delete(),
      faceDescriptor: FieldValue.delete(),
      livenessPassed: FieldValue.delete(),
      rejectionReason: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await ref.update(update);

    return NextResponse.json({ ok: true, uid, kycStatus: "pending" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "KYC deletion failed" },
      { status: 500 }
    );
  }
}
