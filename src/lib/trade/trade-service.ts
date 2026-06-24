import { getClientFirestore } from "@/lib/firebase";
import { doc, runTransaction, collection, query, where, getDocs } from "firebase/firestore";
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
    await runTransaction(db, async (transaction) => {
      // 1. Fetch user's spot wallets
      const walletsRef = collection(db, "wallets");
      const qBase = query(walletsRef, where("userId", "==", uid), where("type", "==", "spot"), where("coin", "==", baseCoin));
      const qQuote = query(walletsRef, where("userId", "==", uid), where("type", "==", "spot"), where("coin", "==", quoteCoin));
      
      const baseDocs = await getDocs(qBase);
      const quoteDocs = await getDocs(qQuote);
      
      let baseDocRef = null;
      let quoteDocRef = null;
      let baseData: Partial<SpotHolding> = { amount: 0, avgBuyPrice: 0 };
      let quoteData: Partial<SpotHolding> = { amount: 0, avgBuyPrice: 0 };

      if (!baseDocs.empty) {
        baseDocRef = baseDocs.docs[0].ref;
        baseData = baseDocs.docs[0].data();
      } else {
        baseDocRef = doc(walletsRef); // new doc
      }

      if (!quoteDocs.empty) {
        quoteDocRef = quoteDocs.docs[0].ref;
        quoteData = quoteDocs.docs[0].data();
      } else {
        quoteDocRef = doc(walletsRef); // new doc
      }

      const currentBaseAmount = baseData.amount || 0;
      const currentQuoteAmount = quoteData.amount || 0;

      // 2. Validate balances & Calculate new balances
      let newBaseAmount = currentBaseAmount;
      let newQuoteAmount = currentQuoteAmount;

      if (side === "buy") {
        if (currentQuoteAmount < totalQuote) throw new Error("Insufficient USDT balance");
        newQuoteAmount -= totalQuote;
        newBaseAmount += amountBase;
      } else {
        if (currentBaseAmount < amountBase) throw new Error(`Insufficient ${baseCoin} balance`);
        newBaseAmount -= amountBase;
        newQuoteAmount += totalQuote;
      }

      // 3. Apply updates
      if (baseDocs.empty) {
        transaction.set(baseDocRef, {
          userId: uid,
          type: "spot",
          coin: baseCoin,
          amount: newBaseAmount,
          avgBuyPrice: side === "buy" ? priceQuote : 0,
          updatedAt: Date.now()
        });
      } else {
        transaction.update(baseDocRef, { amount: newBaseAmount, updatedAt: Date.now() });
      }

      if (quoteDocs.empty) {
        transaction.set(quoteDocRef, {
          userId: uid,
          type: "spot",
          coin: quoteCoin,
          amount: newQuoteAmount,
          updatedAt: Date.now()
        });
      } else {
        transaction.update(quoteDocRef, { amount: newQuoteAmount, updatedAt: Date.now() });
      }

      // 4. Record the trade
      const tradeRef = doc(collection(db, "transactions"));
      const tradeRecord: Partial<TransactionRecord> = {
        type: "trade",
        status: "completed",
        coin: baseCoin, // Represents the primary coin traded
        amount: side === "buy" ? amountBase : -amountBase, // positive means we bought it, negative means sold
        usdValue: totalQuote,
        timestamp: Date.now(),
        fee: 0, // No fee currently
      };
      
      transaction.set(tradeRef, {
        userId: uid,
        ...tradeRecord,
        tradeSide: side,
        tradePrice: priceQuote,
        quoteCoin: quoteCoin
      });
    });

    return { success: true };
  } catch (err: any) {
    console.error("Trade execution failed:", err);
    return { success: false, message: err.message || "Failed to execute trade" };
  }
}
