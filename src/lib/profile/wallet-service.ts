import { getClientFirestore } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, onSnapshot, Unsubscribe } from "firebase/firestore";

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

export type TransactionType = "deposit" | "withdrawal" | "transfer" | "trade" | "reward";
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

export async function getTransactions(uid: string, txType?: TransactionType, limitCount = 50): Promise<TransactionRecord[]> {
  try {
    const db = getClientFirestore();
    let q = query(collection(db, "transactions"), where("userId", "==", uid), orderBy("timestamp", "desc"), limit(limitCount));
    
    if (txType) {
      q = query(collection(db, "transactions"), where("userId", "==", uid), where("type", "==", txType), orderBy("timestamp", "desc"), limit(limitCount));
    }
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionRecord));
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

export function subscribeTransactions(uid: string, txType: TransactionType | undefined, limitCount: number, callback: (transactions: TransactionRecord[]) => void): Unsubscribe {
  const db = getClientFirestore();
  let q = query(collection(db, "transactions"), where("userId", "==", uid), orderBy("timestamp", "desc"), limit(limitCount));
  
  if (txType) {
    q = query(collection(db, "transactions"), where("userId", "==", uid), where("type", "==", txType), orderBy("timestamp", "desc"), limit(limitCount));
  }
  
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback([]);
      return;
    }
    const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionRecord));
    callback(txs);
  }, (error) => {
    console.error("Failed to subscribe to transactions", error);
    callback([]);
  });
}
