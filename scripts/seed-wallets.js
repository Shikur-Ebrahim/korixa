/**
 * seed-wallets.js
 * Finds the first user in Firebase Auth and assigns them Funding + Spot wallets
 * with 10,000 USDT balance. Safe to re-run — skips users who already have wallets.
 *
 * Usage: node scripts/seed-wallets.js [email]
 * If no email is provided, lists all users and seeds the first one found.
 */

require("dotenv").config({ path: ".env" });

const admin = require("firebase-admin");

// ---------------------------------------------------------------------------
// Init Firebase Admin
// ---------------------------------------------------------------------------
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "")
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/\\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || "").trim(),
      privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ---------------------------------------------------------------------------
// Wallet definitions
// ---------------------------------------------------------------------------
const DEFAULT_ASSETS = [
  { coin: "USDT", name: "Tether US",  fundingBalance: 10000 },
  { coin: "BTC",  name: "Bitcoin",    fundingBalance: 0 },
  { coin: "ETH",  name: "Ethereum",   fundingBalance: 0 },
  { coin: "SOL",  name: "Solana",     fundingBalance: 0 },
  { coin: "BNB",  name: "BNB",        fundingBalance: 0 },
];

// ---------------------------------------------------------------------------
// Core seeding function
// ---------------------------------------------------------------------------
async function seedWalletsForUser(uid, email) {
  console.log(`\n🔍 Checking wallets for: ${email} (${uid})`);

  // Check if wallets already exist
  const existing = await db
    .collection("wallets")
    .where("userId", "==", uid)
    .limit(1)
    .get();

  if (!existing.empty) {
    // Update USDT funding balance to 10000 regardless
    const usdtWallet = await db
      .collection("wallets")
      .where("userId", "==", uid)
      .where("type", "==", "funding")
      .where("coin", "==", "USDT")
      .get();

    if (!usdtWallet.empty) {
      await usdtWallet.docs[0].ref.update({ balance: 10000, availableBalance: 10000 });
      console.log(`✅ Updated existing USDT funding wallet to $10,000 for ${email}`);
    } else {
      console.log(`⚠️  Wallets exist but no USDT funding wallet found — creating full set...`);
    }
    if (!usdtWallet.empty) return;
  }

  // Create all wallets in a batch
  const batch = db.batch();
  const walletsRef = db.collection("wallets");

  for (const asset of DEFAULT_ASSETS) {
    const fundingRef = walletsRef.doc();
    batch.set(fundingRef, {
      userId: uid,
      type: "funding",
      coin: asset.coin,
      name: asset.name,
      balance: asset.fundingBalance,
      availableBalance: asset.fundingBalance,
      lockedBalance: 0,
      usdValue: asset.fundingBalance,
      change24h: 0,
    });

    const spotRef = walletsRef.doc();
    batch.set(spotRef, {
      userId: uid,
      type: "spot",
      coin: asset.coin,
      amount: 0,
      avgBuyPrice: 0,
      updatedAt: Date.now(),
    });
  }

  await batch.commit();
  console.log(`✅ Created wallets with $10,000 USDT funding balance for ${email}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const targetEmail = process.argv[2];

  if (targetEmail) {
    // Seed specific user by email
    try {
      const userRecord = await auth.getUserByEmail(targetEmail);
      await seedWalletsForUser(userRecord.uid, userRecord.email);
    } catch (err) {
      console.error(`❌ User not found: ${targetEmail}`);
      console.error(err.message);
    }
  } else {
    // List all users and seed each one
    console.log("📋 Listing all Firebase Auth users...\n");
    const listResult = await auth.listUsers(100);

    if (listResult.users.length === 0) {
      console.log("❌ No users found in Firebase Auth.");
      return;
    }

    console.log(`Found ${listResult.users.length} user(s):`);
    listResult.users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.email || u.uid} (uid: ${u.uid})`);
    });

    console.log("\n💰 Seeding wallets for all users...");
    for (const user of listResult.users) {
      await seedWalletsForUser(user.uid, user.email || user.uid);
    }
  }

  console.log("\n🎉 Done! Refresh your app to see the updated balances.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
