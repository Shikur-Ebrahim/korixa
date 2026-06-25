"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeFundingWallets, subscribeSpotHoldings } from "@/lib/profile/wallet-service";
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

    let fundingLoaded = false;
    let spotLoaded = false;

    const checkLoading = () => {
      if (fundingLoaded && spotLoaded) setLoading(false);
    };

    const unsubFunding = subscribeFundingWallets(user.uid, (data) => {
      setFundingWallets(data);
      fundingLoaded = true;
      checkLoading();
    });

    const unsubSpot = subscribeSpotHoldings(user.uid, (data) => {
      setSpotHoldings(data);
      spotLoaded = true;
      checkLoading();
    });

    return () => {
      unsubFunding();
      unsubSpot();
    };
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
