import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getIncomingUsdtTransfers } from "@/lib/deposit/tron";
import { FieldValue } from "firebase-admin/firestore";

/**
 * GET /api/cron/check-deposits
 *
 * Called every 1 minute by Vercel Cron.
 * Scans ALL user TRC20 deposit addresses on TronGrid and automatically
 * credits any new confirmed USDT deposits that haven't been processed yet.
 *
 * Secured by CRON_SECRET header (set in Vercel env).
 */
export async function GET(req: Request) {
  // ── Security: Verify Vercel cron secret ──────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const db = getAdminDb();

  const stats = {
    addressesChecked: 0,
    depositsFound: 0,
    usersCredited: 0,
    totalUsdtCredited: 0,
    errors: 0,
    durationMs: 0,
  };

  try {
    // ── 1. Load all TRC20 deposit addresses ──────────────────────────────────
    const snapshot = await db
      .collectionGroup("deposit_addresses")
      .where("chain", "==", "TRC20")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ ok: true, message: "No addresses to check.", stats });
    }

    stats.addressesChecked = snapshot.docs.length;

    // ── 2. Process each address ───────────────────────────────────────────────
    const processingPromises = snapshot.docs.map(async (addrDoc) => {
      const data = addrDoc.data();
      const address: string = data.address;
      const userId: string | undefined = addrDoc.ref.parent.parent?.id;
      const processedTxIds: string[] = data.processedTxIds || [];

      if (!address || !userId) return;

      try {
        // ── 3. Fetch incoming transfers from TronGrid ──────────────────────
        const transfers = await getIncomingUsdtTransfers(address);

        const newTransfers = transfers.filter(
          (tx: { txId: string }) => !processedTxIds.includes(tx.txId)
        );

        if (newTransfers.length === 0) return;

        // ── 4. Calculate total new deposit amount ──────────────────────────
        const newAmount = newTransfers.reduce(
          (sum: number, tx: { amount: number }) => sum + tx.amount,
          0
        );
        const newTxIds = newTransfers.map((tx: { txId: string }) => tx.txId);

        if (newAmount <= 0) return;

        // ── 5. Credit user wallet (atomic transaction) ─────────────────────
        const walletRef = db.doc(`users/${userId}/wallet/default`);
        const legacyWalletQuery = await db.collection("wallets")
          .where("userId", "==", userId)
          .where("type", "==", "funding")
          .where("coin", "==", "USDT")
          .limit(1)
          .get();

        await db.runTransaction(async (txn) => {
          const walletSnap = await txn.get(walletRef);
          const currentUsdt = walletSnap.data()?.balances?.USDT ?? 0;

          // Credit wallet
          txn.set(
            walletRef,
            {
              balances: { USDT: FieldValue.increment(newAmount) },
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          // Update legacy wallet if it exists
          if (!legacyWalletQuery.empty) {
            txn.update(legacyWalletQuery.docs[0].ref, {
              balance: FieldValue.increment(newAmount),
              availableBalance: FieldValue.increment(newAmount),
              usdValue: FieldValue.increment(newAmount),
            });
          }

          // Mark txIds as processed
          txn.update(addrDoc.ref, {
            processedTxIds: FieldValue.arrayUnion(...newTxIds),
            processedBalance: FieldValue.increment(newAmount),
            lastDepositAt: new Date().toISOString(),
          });
        });

        // If legacy wallet didn't exist, create it (outside transaction for simplicity)
        if (legacyWalletQuery.empty) {
          await db.collection("wallets").add({
            userId: userId,
            type: "funding",
            coin: "USDT",
            name: "Tether US",
            balance: newAmount,
            availableBalance: newAmount,
            lockedBalance: 0,
            usdValue: newAmount,
            change24h: 0,
          });
        }

        // ── 6. Record each transaction in history (outside atomic txn) ─────
        const batch = db.batch();
        for (const tx of newTransfers) {
          const txRef = db.doc(`users/${userId}/transactions/${tx.txId}`);
          batch.set(txRef, {
            type: "deposit",
            asset: "USDT",
            amount: tx.amount,
            status: "completed",
            timestamp: new Date(tx.timestamp || Date.now()).toISOString(),
            chain: "TRC20",
            address: address,
            txId: tx.txId,
            autoProcessed: true,
          });

          // Also record in global deposits collection (dedup by txId)
          const depositRef = db.doc(`deposits/${tx.txId.toLowerCase()}`);
          batch.set(depositRef, {
            id: tx.txId.toLowerCase(),
            userId,
            chain: "TRC20",
            token: "USDT",
            address,
            amount: tx.amount,
            txHash: tx.txId,
            status: "confirmed",
            confirmations: 1,
            blockNumber: null,
            createdAt: new Date(tx.timestamp || Date.now()).toISOString(),
            confirmedAt: new Date().toISOString(),
            autoProcessed: true,
          }, { merge: true });
        }
        await batch.commit();

        // ── 7. Send in-app notification ────────────────────────────────────
        try {
          await db.collection(`users/${userId}/notifications`).add({
            type: "deposit",
            title: "Deposit Confirmed",
            message: `Your deposit of ${newAmount.toFixed(2)} USDT has been confirmed and added to your wallet.`,
            amount: newAmount,
            asset: "USDT",
            chain: "TRC20",
            txIds: newTxIds,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Notification failure should not block credit
        }

        stats.depositsFound += newTransfers.length;
        stats.usersCredited += 1;
        stats.totalUsdtCredited += newAmount;

        console.log(
          `[cron/check-deposits] Credited ${newAmount} USDT to user ${userId} (${newTxIds.length} tx)`
        );
      } catch (addrErr: any) {
        stats.errors += 1;
        console.error(
          `[cron/check-deposits] Error processing address ${address}:`,
          addrErr.message
        );
      }
    });

    // Run all address checks in parallel (with a concurrency limit via chunking)
    const CHUNK_SIZE = 10;
    for (let i = 0; i < processingPromises.length; i += CHUNK_SIZE) {
      await Promise.allSettled(processingPromises.slice(i, i + CHUNK_SIZE));
    }

    stats.durationMs = Date.now() - startTime;

    // ── 8. Log the cron run to Firestore for admin visibility ─────────────
    await db.collection("cronLogs").add({
      job: "check-deposits",
      ...stats,
      ranAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, stats });
  } catch (err: any) {
    console.error("[cron/check-deposits] Fatal error:", err);
    stats.durationMs = Date.now() - startTime;
    return NextResponse.json(
      { ok: false, error: err.message, stats },
      { status: 500 }
    );
  }
}
