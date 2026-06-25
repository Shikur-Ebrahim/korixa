import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";

export interface TradingSettings {
  hideSmallBalances: boolean;
  requireOrderConfirmation: boolean;
  defaultOrderType: "market" | "limit";
  defaultTradingPair: string;
  priceAlerts: boolean;
  marketNotifications: boolean;
  p2pNotifications: boolean;
  chartTimeframe: "1" | "5" | "15" | "60" | "240" | "D";
  riskWarnings: boolean;
  chartTheme: "dark" | "light" | "system";
  autoRefreshMarketData: boolean;
  updatedAt: number;
}

export const DEFAULT_TRADING_SETTINGS: TradingSettings = {
  hideSmallBalances: false,
  requireOrderConfirmation: true,
  defaultOrderType: "market",
  defaultTradingPair: "BTCUSDT",
  priceAlerts: true,
  marketNotifications: true,
  p2pNotifications: true,
  chartTimeframe: "60",
  riskWarnings: true,
  chartTheme: "dark",
  autoRefreshMarketData: true,
  updatedAt: Date.now(),
};

export function subscribeTradingSettings(
  uid: string,
  callback: (settings: TradingSettings) => void
): Unsubscribe {
  const db = getClientFirestore();
  const ref = doc(db, "users", uid, "tradingSettings", "preferences");

  return onSnapshot(ref, async (snap) => {
    if (!snap.exists()) {
      // Auto-create defaults on first visit
      await setDoc(ref, DEFAULT_TRADING_SETTINGS);
      callback(DEFAULT_TRADING_SETTINGS);
    } else {
      callback({ ...DEFAULT_TRADING_SETTINGS, ...snap.data() } as TradingSettings);
    }
  }, (error) => {
    console.error("Failed to subscribe to trading settings:", error);
    callback(DEFAULT_TRADING_SETTINGS);
  });
}

export async function updateTradingSettings(
  uid: string,
  updates: Partial<TradingSettings>
): Promise<void> {
  const db = getClientFirestore();
  const ref = doc(db, "users", uid, "tradingSettings", "preferences");
  await setDoc(ref, { ...updates, updatedAt: Date.now() }, { merge: true });
}
