import { NextResponse } from "next/server";
import { getAdminDb } from "@/src/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    let db;
    try {
      db = require("@/src/lib/firebase-admin").getAdminDb();
    } catch (e) {
      db = require("@/lib/firebase-admin").getAdminDb();
    }
    
    const snap = await db.collection("admin").doc("settings").get();
    if (!snap.exists) {
      return NextResponse.json({ etbRate: 175, telegramUsername: "@korixapay" });
    }
    const data = snap.data();
    return NextResponse.json({
      etbRate: data?.etbRate || 175,
      telegramUsername: data?.telegramUsername || "@korixapay",
    });
  } catch (e: any) {
    return NextResponse.json({ etbRate: 175, telegramUsername: "@korixapay" });
  }
}
