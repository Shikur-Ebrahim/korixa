import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("depositNetworks")
      .where("isActive", "==", true)
      .get();
      
    const networks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by oldest added first (createdAt ascending)
    networks.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    
    return NextResponse.json(networks);
  } catch (error) {
    console.error("Failed to fetch deposit networks", error);
    return NextResponse.json({ error: "Failed to load networks" }, { status: 500 });
  }
}
