import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";
import { getRoleFromToken } from "@/lib/auth/get-role";

export async function GET(request: Request) {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("depositNetworks").orderBy("createdAt", "desc").get();
    const networks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(networks);
  } catch (error) {
    console.error("Failed to fetch deposit networks", error);
    return NextResponse.json({ error: "Failed to load networks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await request.json();
    const { name, symbol, network, address, minDeposit } = data;

    if (!name || !network || !address || minDeposit === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getAdminDb();
    const docRef = await db.collection("depositNetworks").add({
      name,
      symbol: symbol || "USDT",
      network,
      address,
      minDeposit: Number(minDeposit),
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Failed to add deposit network", error);
    return NextResponse.json({ error: "Failed to add network" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getRoleFromToken(token);
    if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await request.json();
    const { id, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const db = getAdminDb();
    await db.collection("depositNetworks").doc(id).update({
      isActive: Boolean(isActive),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update deposit network", error);
    return NextResponse.json({ error: "Failed to update network" }, { status: 500 });
  }
}
