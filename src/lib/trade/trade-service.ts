import { getClientFirestore } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { SpotHolding, TransactionRecord } from "@/lib/profile/wallet-service";

export type TradeResult = { success: boolean; message?: string };

export async function executeSpotTrade(
  uid: string,
  baseCoin: string,   // e.g., "BTC"
  quoteCoin: string,  // e.g., "USDT"
  side: "buy" | "sell",
  amountBase: number, // e.g., 0.1 BTC
  priceQuote: number  // e.g., 65000 USDT/BTC
): Promise<TradeResult> {
  const db = getClientFirestore();
  const totalQuote = amountBase * priceQuote;

  try {
    // ─── Step 1: Fetch document references OUTSIDE the transaction ──────────
    const walletsRef = collection(db, "wallets");

    const qBase = query(
      walletsRef,
      where("userId", "==", uid),
      where("type", "==", "spot"),
      where("coin", "==", baseCoin)
    );
    const qQuote = query(
      walletsRef,
      where("userId", "==", uid),
      where("type", "==", "spot"),
      where("coin", "==", quoteCoin)
    );

    const [baseDocs, quoteDocs] = await Promise.all([
      getDocs(qBase),
      getDocs(qQuote),
    ]);

    // Resolve (or create) document refs for each coin
    const baseDocRef = baseDocs.empty
      ? doc(walletsRef)
      : baseDocs.docs[0].ref;

    const quoteDocRef = quoteDocs.empty
      ? doc(walletsRef)
      : quoteDocs.docs[0].ref;

    const baseExists = !baseDocs.empty;
    const quoteExists = !quoteDocs.empty;

    // ─── Step 2: Run the atomic transaction ─────────────────────────────────
    await runTransaction(db, async (transaction) => {
      // Re-read using transaction.get() for consistent snapshot
      const [baseSnap, quoteSnap] = await Promise.all([
        transaction.get(baseDocRef),
        transaction.get(quoteDocRef),
      ]);

      const currentBaseAmount: number = (baseSnap.exists() ? (baseSnap.data() as Partial<SpotHolding>).amount : 0) ?? 0;
      const currentQuoteAmount: number = (quoteSnap.exists() ? (quoteSnap.data() as Partial<SpotHolding>).amount : 0) ?? 0;

      // Validate balances
      if (side === "buy" && currentQuoteAmount < totalQuote) {
        throw new Error(`Insufficient ${quoteCoin} balance. Need ${totalQuote.toFixed(2)} but have ${currentQuoteAmount.toFixed(2)}`);
      }
      if (side === "sell" && currentBaseAmount < amountBase) {
        throw new Error(`Insufficient ${baseCoin} balance. Need ${amountBase} but have ${currentBaseAmount}`);
      }

      // Calculate new balances
      const newBaseAmount =
        side === "buy"
          ? currentBaseAmount + amountBase
          : currentBaseAmount - amountBase;

      const newQuoteAmount =
        side === "buy"
          ? currentQuoteAmount - totalQuote
          : currentQuoteAmount + totalQuote;

      const now = Date.now();

      // Apply base coin update/create
      if (baseExists || baseSnap.exists()) {
        transaction.update(baseDocRef, { amount: newBaseAmount, updatedAt: now });
      } else {
        transaction.set(baseDocRef, {
          userId: uid,
          type: "spot",
          coin: baseCoin,
          amount: newBaseAmount,
          avgBuyPrice: side === "buy" ? priceQuote : 0,
          updatedAt: now,
        });
      }

      // Apply quote coin update/create
      if (quoteExists || quoteSnap.exists()) {
        transaction.update(quoteDocRef, { amount: newQuoteAmount, updatedAt: now });
      } else {
        transaction.set(quoteDocRef, {
          userId: uid,
          type: "spot",
          coin: quoteCoin,
          amount: newQuoteAmount,
          avgBuyPrice: 0,
          updatedAt: now,
        });
      }

      // Record the trade in transactions collection
      const tradeRef = doc(collection(db, "transactions"));
      const tradeRecord: Partial<TransactionRecord> & Record<string, unknown> = {
        userId: uid,
        type: "trade",
        status: "completed",
        coin: baseCoin,
        amount: side === "buy" ? amountBase : -amountBase,
        usdValue: totalQuote,
        timestamp: now,
        fee: 0,
        tradeSide: side,
        tradePrice: priceQuote,
        quoteCoin: quoteCoin,
      };

      transaction.set(tradeRef, tradeRecord);
    });

    return { success: true };
  } catch (err: unknown) {
    console.error("Trade execution failed:", err);
    const message = err instanceof Error ? err.message : "Failed to execute trade";
    return { success: false, message };
  }
}
