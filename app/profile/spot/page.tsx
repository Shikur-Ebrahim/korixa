"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEye, FiEyeOff, FiDownload, FiUpload, FiRepeat } from "react-icons/fi";
import { motion } from "framer-motion";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { TransferModal } from "@/components/profile/TransferModal";
import { MarketTable } from "@/components/landing/market/MarketTable";
import { GlobalStatsBar } from "@/components/landing/market/GlobalStatsBar";
import { InsightList } from "@/components/landing/market/InsightList";
import { TopGainersList } from "@/components/landing/market/TopGainersList";
import type { AppMarketPageData } from "@/lib/coingecko";
import Link from "next/link";
import { useBinanceTickers } from "@/hooks/useBinanceMarket";

const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  USDT: "#26A17B",
  SOL: "#14F195",
  BNB: "#F3BA2F",
};

const COIN_LOGOS: Record<string, string> = {
  BTC:  "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
  ETH:  "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
  USDT: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png",
  SOL:  "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
  BNB:  "https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png",
};

const EMPTY_SPOT_ASSETS: SpotHolding[] = [
  { id: "1", coin: "USDT" as any, amount: 0, avgBuyPrice: 0, currentPrice: 1, unrealizedPnl: 0, value: 0 },
  { id: "2", coin: "BTC" as any, amount: 0, avgBuyPrice: 0, currentPrice: 65000, unrealizedPnl: 0, value: 0 },
  { id: "3", coin: "ETH" as any, amount: 0, avgBuyPrice: 0, currentPrice: 3500, unrealizedPnl: 0, value: 0 },
  { id: "4", coin: "SOL" as any, amount: 0, avgBuyPrice: 0, currentPrice: 150, unrealizedPnl: 0, value: 0 },
  { id: "5", coin: "BNB" as any, amount: 0, avgBuyPrice: 0, currentPrice: 600, unrealizedPnl: 0, value: 0 },
];

export default function SpotAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assets, setAssets] = useState<SpotHolding[]>([]);
  const [marketData, setMarketData] = useState<AppMarketPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const COINS = ["USDT", "BTC", "ETH", "SOL", "BNB"];
  const SYMBOLS = COINS.filter(c => c !== "USDT").map(c => `${c}USDT`);
  const { data: tickers } = useBinanceTickers(SYMBOLS);

  const getPrice = (coin: string) => {
    if (coin === "USDT") return 1;
    const t = (tickers ?? []).find(x => x.symbol === `${coin}USDT`);
    return parseFloat(t?.lastPrice ?? "0") || 0;
  };
  const getChange = (coin: string) => {
    if (coin === "USDT") return 0;
    const t = (tickers ?? []).find(x => x.symbol === `${coin}USDT`);
    return parseFloat(t?.priceChangePercent ?? "0");
  };

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeSpotHoldings(user.uid, (data) => {
        setAssets(data.length > 0 ? data : EMPTY_SPOT_ASSETS);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setMarketData(data);
        }
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      } finally {
        setMarketLoading(false);
      }
    };
    fetchMarket();
  }, []);

  // Live totals using Binance prices
  const totalUsd = assets.reduce((sum, asset) => {
    const amount = asset.amount ?? (asset as any).balance ?? 0;
    return sum + amount * getPrice(asset.coin);
  }, 0);

  const formatUsd = (val: number) => {
    return hideBalances ? "******" : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const formatCrypto = (val: number) => {
    return hideBalances ? "******" : val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <h1 className="text-lg font-bold text-white">Spot Account</h1>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8">
        {/* Account Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#1e2329] p-1 mb-6">
          <button onClick={() => router.push("/profile/funding")} className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition text-[#848e9c] hover:text-white">
            Funding
          </button>
          <button className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition bg-[#2b3139] text-white shadow cursor-default">
            Spot
          </button>
        </div>

        {/* Total Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-[#161a1e] to-[#0b0e11] p-6 shadow-xl border border-white/[0.04] relative overflow-hidden"
        >
          {/* Subtle glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className="text-[#848e9c] text-sm font-medium">Est. Total Balance</span>
            <button onClick={() => setHideBalances(!hideBalances)} className="text-[#848e9c] hover:text-white transition p-1">
              {hideBalances ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {formatUsd(totalUsd)}
            </h2>
            {!hideBalances && <span className="text-[#848e9c] font-medium">USD</span>}
          </div>
          <div className="mt-1 relative z-10 text-sm">
            <span className="text-[#848e9c]">≈ {formatCrypto(totalUsd / 65000)} BTC</span>
          </div>

          {/* Quick Actions Row */}
          <div className="grid grid-cols-4 gap-3 mt-8 relative z-10">
            <Link href="/trade" className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                <FiRepeat size={20} />
              </div>
              <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">
                Trade
              </span>
            </Link>
            
            <Link href="/deposit" className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                <FiDownload size={20} />
              </div>
              <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">
                Deposit
              </span>
            </Link>

            <button className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                <FiUpload size={20} />
              </div>
              <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">
                Withdraw
              </span>
            </button>

            <button onClick={() => setTransferOpen(true)} className="flex flex-col items-center gap-2 group cursor-pointer">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                <FiRepeat size={20} />
              </div>
              <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">
                Transfer
              </span>
            </button>
          </div>
        </motion.div>

        {/* Asset List */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Assets</h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                    <div className="space-y-2">
                      <div className="w-16 h-4 rounded bg-white/[0.04]" />
                      <div className="w-24 h-3 rounded bg-white/[0.04]" />
                    </div>
                  </div>
                  <div className="space-y-2 items-end flex flex-col">
                    <div className="w-20 h-4 rounded bg-white/[0.04]" />
                    <div className="w-16 h-3 rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
              {assets.map((asset) => {
                const price = getPrice(asset.coin);
                const change = getChange(asset.coin);
                const amount = asset.amount ?? (asset as any).balance ?? 0;
                const usdVal = amount * price;
                const positive = change >= 0;

                return (
                  <motion.div 
                    key={asset.id} 
                    variants={itemVariants}
                    onClick={() => router.push(`/profile/spot/${asset.coin.toLowerCase()}`)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.02] rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0">
                        <img
                          src={COIN_LOGOS[asset.coin] ?? `https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png`}
                          alt={asset.coin}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#161a1f]"
                          style={{ background: COIN_COLORS[asset.coin] ?? "#848e9c" }}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#eaecef] leading-tight">{asset.coin}</p>
                        <p className="text-xs text-[#848e9c]">Market rate</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-[#eaecef] leading-tight">{formatCrypto(amount)}</p>
                        <p className="text-xs text-[#848e9c]">≈ {formatUsd(usdVal)}</p>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <p className={`text-xs font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                          {positive ? "+" : ""}{change.toFixed(2)}%
                        </p>
                        <p className="text-[11px] text-[#848e9c]">${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: asset.coin === "BTC" ? 0 : 2 })}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {assets.length === 0 && (
                <div className="py-12 text-center text-[#848e9c]">
                  <p>No assets found.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Market Overview Section */}
        <div className="mt-8">
          <div className="mb-4 text-center sm:mb-6">
            <h2 className="mb-1.5 text-lg font-bold sm:text-xl text-white">Market Overview</h2>
            <p className="text-xs text-muted sm:text-sm">
              Live cryptocurrency prices by market cap
            </p>
          </div>

          {marketLoading || !marketData || !marketData.global ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse h-14 rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <GlobalStatsBar global={marketData.global} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InsightList title="Trending Coins" coins={marketData.trending} accent="primary" />
                <TopGainersList coins={marketData.topGainers} />
              </div>

              <MarketTable coins={marketData.coins} />
            </div>
          )}
        </div>
      </div>

      <TransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} defaultFrom="funding" />
    </div>
  );
}
