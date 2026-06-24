/**
 * assign-balance.js
 * Uses the Service Accounts.json file directly to bypass .env credential issues.
 * 
 * Usage: node assign-balance.js <email>
 */

const admin = require("firebase-admin");
const serviceAccount = require("./Service Accounts.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

const DEFAULT_ASSETS = [
  { coin: "USDT", name: "Tether US",  fundingBalance: 10000 },
  { coin: "BTC",  name: "Bitcoin",    fundingBalance: 0 },
  { coin: "ETH",  name: "Ethereum",   fundingBalance: 0 },
  { coin: "SOL",  name: "Solana",     fundingBalance: 0 },
  { coin: "BNB",  name: "BNB",        fundingBalance: 0 },
];

async function assignBalance(email) {
  console.log(`\n🔍  Looking up user: ${email}`);

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    console.error(`❌  No Firebase user found with email: ${email}`);
    console.error("    Make sure the account exists in Firebase Auth.");
    process.exit(1);
  }

  const { uid } = user;
  console.log(`✅  Found user UID: ${uid}`);

  // Check for existing wallets
  const existing = await db.collection("wallets").where("userId", "==", uid).get();

  if (!existing.empty) {
    console.log(`📦  User already has ${existing.size} wallet doc(s). Updating USDT funding to $10,000...`);

    // Find & update the USDT funding wallet
    const usdtQuery = await db.collection("wallets")
      .where("userId", "==", uid)
      .where("type", "==", "funding")
      .where("coin", "==", "USDT")
      .get();

    if (!usdtQuery.empty) {
      await usdtQuery.docs[0].ref.update({
        balance: 10000,
        availableBalance: 10000,
        usdValue: 10000,
      });
      console.log(`✅  Updated USDT Funding Wallet → $10,000 balance`);
    } else {
      // No USDT funding wallet found — create full set
      console.log("⚠️   No USDT funding wallet found. Creating full wallet set...");
      await createAllWallets(uid);
    }
  } else {
    console.log("🆕  No wallets found. Creating full wallet set...");
    await createAllWallets(uid);
  }

  console.log("\n🎉  Done! Refresh the app — the $10,000 USDT should now appear in the Funding section.");
  process.exit(0);
}

async function createAllWallets(uid) {
  const batch = db.batch();
  const walletsRef = db.collection("wallets");
  const now = Date.now();

  for (const asset of DEFAULT_ASSETS) {
    // Funding wallet
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

    // Spot wallet
    const spotRef = walletsRef.doc();
    batch.set(spotRef, {
      userId: uid,
      type: "spot",
      coin: asset.coin,
      amount: 0,
      avgBuyPrice: 0,
      updatedAt: now,
    });
  }

  await batch.commit();
  console.log(`✅  Created 10 wallet docs (5 funding + 5 spot) with $10,000 USDT funding balance`);
}

const email = process.argv[2];
if (!email) {
  console.error("❌  Usage: node assign-balance.js <email>");
  process.exit(1);
}

assignBalance(email).catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
