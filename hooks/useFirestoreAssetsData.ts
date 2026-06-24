"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getFundingWallets, getSpotHoldings } from "@/lib/profile/wallet-service";
import type { WalletAsset, SpotHolding } from "@/lib/profile/wallet-service";
import { useBinanceTickers } from "@/hooks/useBinanceMarket";

const COINS = ["USDT", "BTC", "ETH", "SOL", "BNB"];
const SYMBOLS = COINS.filter(c => c !== "USDT").map(c => `${c}USDT`);

export function useFirestoreAssetsData() {
  const { user } = useAuth();
  const [fundingWallets, setFundingWallets] = useState<WalletAsset[]>([]);
  const [spotHoldings, setSpotHoldings] = useState<SpotHolding[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: tickers } = useBinanceTickers(SYMBOLS);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getFundingWallets(user.uid),
      getSpotHoldings(user.uid),
    ]).then(([fw, sh]) => {
      setFundingWallets(fw);
      setSpotHoldings(sh);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const tickerMap = new Map(
    (tickers ?? []).map(t => [t.symbol, parseFloat(t.lastPrice)])
  );

  const getPrice = (coin: string) => {
    if (coin === "USDT") return 1;
    return tickerMap.get(`${coin}USDT`) ?? 0;
  };

  const getChange = (coin: string) => {
    if (coin === "USDT") return 0;
    const t = (tickers ?? []).find(x => x.symbol === `${coin}USDT`);
    return parseFloat(t?.priceChangePercent ?? "0");
  };

  const fundingTotal = fundingWallets.reduce(
    (sum, w) => sum + (w.balance ?? 0) * getPrice(w.coin), 0
  );
  const spotTotal = spotHoldings.reduce(
    (sum, h) => sum + (h.amount ?? 0) * getPrice(h.coin), 0
  );
  const totalValue = fundingTotal + spotTotal;

  return {
    fundingWallets,
    spotHoldings,
    loading,
    getPrice,
    getChange,
    fundingTotal,
    spotTotal,
    totalValue,
  };
}
