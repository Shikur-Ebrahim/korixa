import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { verifyAuthToken } from "@/lib/auth/verify-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const decoded = await verifyAuthToken(request);
    const uid = decoded.uid;
    const db = getAdminDb();

    const referralCode = uid.substring(0, 8).toUpperCase();

    // 1. Get total friends referred
    const friendsQuery = await db.collection("users")
      .where("referredBy", "==", referralCode)
      .count()
      .get();
    
    const totalFriends = friendsQuery.data().count;

    // 2. Get total earned
    const rewardsQuery = await db.collection("transactions")
      .where("userId", "==", uid)
      .where("type", "==", "referral_reward")
      .where("status", "==", "completed")
      .get();

    let totalEarned = 0;
    rewardsQuery.forEach(doc => {
      totalEarned += Number(doc.data().amount || 0);
    });

    return NextResponse.json({
      totalFriends,
      totalEarned: Number(totalEarned.toFixed(2))
    });
  } catch (error) {
    console.error("Rewards API error:", error);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
