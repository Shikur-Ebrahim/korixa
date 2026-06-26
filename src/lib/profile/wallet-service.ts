import { getClientFirestore } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, Unsubscribe, writeBatch, doc } from "firebase/firestore";

export type AssetType = "BTC" | "ETH" | "USDT" | "SOL" | "BNB" | string;

export interface WalletAsset {
  id: string;
  coin: AssetType;
  name: string;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  usdValue: number;
  change24h: number;
}

export type TransactionType = "deposit" | "withdrawal" | "transfer" | "trade" | "reward" | "p2p_buy" | "p2p_sell" | "crypto_deposit" | string;
export type TransactionStatus = "completed" | "pending" | "failed";

export interface TransactionRecord {
  id: string;
  type: TransactionType;
  coin: AssetType;
  amount: number;
  usdValue: number;
  status: TransactionStatus;
  timestamp: number;
  txId?: string;
  network?: string;
  fee?: number;
  fromAddress?: string;
  toAddress?: string;
  confirmations?: number;
}

export interface SpotHolding {
  id: string;
  coin: AssetType;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  value: number;
}

// Fallback empty states for when Firestore is empty
export const EMPTY_ASSETS: WalletAsset[] = [
  { id: "1", coin: "USDT", name: "Tether US", balance: 0, availableBalance: 0, lockedBalance: 0, usdValue: 0, change24h: 0.01 },
  { id: "2", coin: "BTC", name: "Bitcoin", balance: 0, availableBalance: 0, lockedBalance: 0, usdValue: 0, change24h: -1.2 },
  { id: "3", coin: "ETH", name: "Ethereum", balance: 0, availableBalance: 0, lockedBalance: 0, usdValue: 0, change24h: 2.4 },
  { id: "4", coin: "SOL", name: "Solana", balance: 0, availableBalance: 0, lockedBalance: 0, usdValue: 0, change24h: 5.1 },
  { id: "5", coin: "BNB", name: "BNB", balance: 0, availableBalance: 0, lockedBalance: 0, usdValue: 0, change24h: -0.5 },
];

export async function getFundingWallets(uid: string): Promise<WalletAsset[]> {
  try {
    const db = getClientFirestore();
    const q = query(collection(db, "wallets"), where("userId", "==", uid), where("type", "==", "funding"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return EMPTY_ASSETS;
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletAsset));
  } catch (error) {
    console.error("Failed to fetch funding wallets", error);
    return EMPTY_ASSETS;
  }
}

export async function getSpotHoldings(uid: string): Promise<SpotHolding[]> {
  try {
    const db = getClientFirestore();
    const q = query(collection(db, "wallets"), where("userId", "==", uid), where("type", "==", "spot"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpotHolding));
  } catch (error) {
    console.error("Failed to fetch spot holdings", error);
    return [];
  }
}

export async function getTransactions(uid: string, txType?: TransactionType | TransactionType[], limitCount = 50): Promise<TransactionRecord[]> {
  try {
    const db = getClientFirestore();
    
    // Fetch normal transactions
    const q = query(collection(db, "transactions"), where("userId", "==", uid));
    const snapshot = await getDocs(q);
    let txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionRecord));
    
    // Fetch p2p orders
    const qP2P = query(collection(db, "p2pOrders"), where("buyerId", "==", uid));
    const snapP2P = await getDocs(qP2P);
    const p2pTxs = snapP2P.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type === "buy" ? "p2p_buy" : "p2p_sell",
        coin: "USDT",
        amount: data.amountUSDT,
        usdValue: data.amountUSDT,
        status: data.status === "completed" ? "completed" : (data.status === "cancelled" ? "failed" : "pending"),
        timestamp: new Date(data.createdAt).getTime(),
      } as TransactionRecord;
    });

    // Fetch withdrawals
    const qWithdrawals = query(collection(db, "withdrawals"), where("userId", "==", uid));
    const snapWithdrawals = await getDocs(qWithdrawals);
    const withdrawalTxs = snapWithdrawals.docs.map(doc => {
      const data = doc.data();
      const type = data.type === "internal_transfer" ? "transfer" : "withdrawal";
      return {
        id: doc.id,
        type,
        coin: data.coin,
        amount: data.amount,
        usdValue: data.amount, // Approximate
        status: data.status,
        timestamp: new Date(data.createdAt).getTime(),
        network: data.network,
        destination: data.destination,
      } as TransactionRecord;
    });

    // Fetch received internal transfers (deposits)
    const qReceived = query(collection(db, "withdrawals"), where("destination", "==", uid));
    const snapReceived = await getDocs(qReceived);
    const receivedTxs = snapReceived.docs
      .filter(doc => doc.data().type === "internal_transfer")
      .map(doc => {
        const data = doc.data();
      return {
        id: doc.id,
        type: "deposit", // It's an incoming transfer, so it counts as a deposit
        coin: data.coin,
        amount: data.amount,
        usdValue: data.amount,
        status: data.status,
        timestamp: new Date(data.createdAt).getTime(),
        network: "Internal",
        destination: data.userId, // The sender
      } as TransactionRecord;
    });

    // Merge
    let all = [...txs, ...p2pTxs, ...withdrawalTxs, ...receivedTxs];
    
    if (txType) {
      if (Array.isArray(txType)) {
        all = all.filter(tx => txType.includes(tx.type));
      } else {
        all = all.filter(tx => tx.type === txType);
      }
    }
    
    all.sort((a, b) => b.timestamp - a.timestamp);
    
    return all.slice(0, limitCount);
  } catch (error) {
    console.error("Failed to fetch transactions", error);
    return [];
  }
}

export function subscribeSpotHoldings(uid: string, callback: (holdings: SpotHolding[]) => void): Unsubscribe {
  const db = getClientFirestore();
  const q = query(collection(db, "wallets"), where("userId", "==", uid), where("type", "==", "spot"));
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const holdings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SpotHolding));
    callback(holdings);
  }, (error) => {
    console.error("Failed to subscribe to spot holdings", error);
    callback([]);
  });
}

export function subscribeFundingWallets(uid: string, callback: (wallets: WalletAsset[]) => void): Unsubscribe {
  const db = getClientFirestore();
  const q = query(collection(db, "wallets"), where("userId", "==", uid), where("type", "==", "funding"));
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(EMPTY_ASSETS);
      return;
    }
    const wallets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletAsset));
    callback(wallets);
  }, (error) => {
    console.error("Failed to subscribe to funding wallets", error);
    callback(EMPTY_ASSETS);
  });
}

export function subscribeTransactions(uid: string, txType: TransactionType | TransactionType[] | undefined, limitCount: number, callback: (transactions: TransactionRecord[]) => void): Unsubscribe {
  const db = getClientFirestore();
  
  const txsMap = new Map<string, TransactionRecord>();
  const p2pMap = new Map<string, TransactionRecord>();
  const sentWithdrawalsMap = new Map<string, TransactionRecord>();
  const receivedWithdrawalsMap = new Map<string, TransactionRecord>();

  const notify = () => {
    let all = [...txsMap.values(), ...p2pMap.values(), ...sentWithdrawalsMap.values(), ...receivedWithdrawalsMap.values()];
    
    if (txType) {
      if (Array.isArray(txType)) {
        all = all.filter(tx => txType.includes(tx.type));
      } else {
        all = all.filter(tx => tx.type === txType);
      }
    }
    
    all.sort((a, b) => b.timestamp - a.timestamp);
    if (limitCount > 0) {
      all = all.slice(0, limitCount);
    }
    callback(all);
  };

  const unsubTxs = onSnapshot(query(collection(db, "transactions"), where("userId", "==", uid)), (snapshot) => {
    txsMap.clear();
    snapshot.docs.forEach(doc => {
      txsMap.set(doc.id, { id: doc.id, ...doc.data() } as TransactionRecord);
    });
    notify();
  }, (error) => {
    console.error("Failed to subscribe to transactions", error);
  });

  const unsubP2P = onSnapshot(query(collection(db, "p2pOrders"), where("buyerId", "==", uid)), (snapshot) => {
    p2pMap.clear();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      p2pMap.set(doc.id, {
        id: doc.id,
        type: data.type === "buy" ? "p2p_buy" : "p2p_sell",
        coin: "USDT",
        amount: data.amountUSDT,
        usdValue: data.amountUSDT,
        status: data.status === "completed" ? "completed" : (data.status === "cancelled" ? "failed" : "pending"),
        timestamp: new Date(data.createdAt).getTime(),
      } as TransactionRecord);
    });
    notify();
  }, (error) => {
    console.error("Failed to subscribe to p2pOrders", error);
  });

  const unsubSentWithdrawals = onSnapshot(query(collection(db, "withdrawals"), where("userId", "==", uid)), (snapshot) => {
    sentWithdrawalsMap.clear();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const type = data.type === "internal_transfer" ? "transfer" : "withdrawal";
      sentWithdrawalsMap.set(doc.id, {
        id: doc.id,
        type,
        coin: data.coin,
        amount: data.amount,
        usdValue: data.amount, // Approximate
        status: data.status,
        timestamp: new Date(data.createdAt).getTime(),
        network: data.network,
        destination: data.destination,
      } as TransactionRecord);
    });
    notify();
  }, (error) => {
    console.error("Failed to subscribe to sent withdrawals", error);
  });

  const unsubReceivedWithdrawals = onSnapshot(query(collection(db, "withdrawals"), where("destination", "==", uid)), (snapshot) => {
    receivedWithdrawalsMap.clear();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === "internal_transfer") {
        receivedWithdrawalsMap.set(doc.id, {
          id: doc.id,
          type: "deposit", // It's an incoming transfer, so it counts as a deposit
          coin: data.coin,
          amount: data.amount,
          usdValue: data.amount,
          status: data.status,
          timestamp: new Date(data.createdAt).getTime(),
          network: "Internal",
          destination: data.userId, // The sender
        } as TransactionRecord);
      }
    });
    notify();
  }, (error) => {
    console.error("Failed to subscribe to received withdrawals", error);
  });

  return () => {
    unsubTxs();
    unsubP2P();
    unsubSentWithdrawals();
    unsubReceivedWithdrawals();
  };
}

export async function ensureUserWallets(uid: string): Promise<void> {
  try {
    const db = getClientFirestore();
    const q = query(collection(db, "wallets"), where("userId", "==", uid), limit(1));
    const snapshot = await getDocs(q);

    // If user already has wallets, do nothing
    if (!snapshot.empty) return;

    // Create batch
    const batch = writeBatch(db);
    const walletsRef = collection(db, "wallets");

    const defaultAssets = [
      { coin: "USDT", name: "Tether US" },
      { coin: "BTC", name: "Bitcoin" },
      { coin: "ETH", name: "Ethereum" },
      { coin: "SOL", name: "Solana" },
      { coin: "BNB", name: "BNB" },
    ];

    for (const asset of defaultAssets) {
      // Funding Wallet
      const fundingRef = doc(walletsRef);
      batch.set(fundingRef, {
        userId: uid,
        type: "funding",
        coin: asset.coin,
        name: asset.name,
        balance: 0,
        availableBalance: 0,
        lockedBalance: 0,
        usdValue: 0,
        change24h: 0,
      });

      // Spot Wallet
      const spotRef = doc(walletsRef);
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
    console.log("Initialized default wallets for new user.");
  } catch (error) {
    console.error("Failed to ensure user wallets:", error);
  }
}
