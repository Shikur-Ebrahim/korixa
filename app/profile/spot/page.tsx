"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEye, FiEyeOff, FiDownload, FiUpload, FiRepeat } from "react-icons/fi";
import { motion } from "framer-motion";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { TransferModal } from "@/components/profile/TransferModal";
import { useBinanceTickers } from "@/hooks/useBinanceMarket";
import Link from "next/link";

const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A", ETH: "#627EEA", USDT: "#26A17B", SOL: "#14F195", BNB: "#F3BA2F",
};
const COIN_LOGOS: Record<string, string> = {
  BTC:  "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
  ETH:  "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
  USDT: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png",
  SOL:  "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
  BNB:  "https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png",
};
const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"];

const EMPTY_SPOT: SpotHolding[] = [
  { id: "1", coin: "USDT" as any, amount: 0, avgBuyPrice: 0, currentPrice: 1, unrealizedPnl: 0, value: 0 },
  { id: "2", coin: "BTC"  as any, amount: 0, avgBuyPrice: 0, currentPrice: 0, unrealizedPnl: 0, value: 0 },
  { id: "3", coin: "ETH"  as any, amount: 0, avgBuyPrice: 0, currentPrice: 0, unrealizedPnl: 0, value: 0 },
  { id: "4", coin: "SOL"  as any, amount: 0, avgBuyPrice: 0, currentPrice: 0, unrealizedPnl: 0, value: 0 },
  { id: "5", coin: "BNB"  as any, amount: 0, avgBuyPrice: 0, currentPrice: 0, unrealizedPnl: 0, value: 0 },
];

export default function SpotAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assets, setAssets] = useState<SpotHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

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
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeSpotHoldings(user.uid, (data) => {
      setAssets(data.length > 0 ? data : EMPTY_SPOT);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const totalUsd = useMemo(
    () => assets.reduce((sum, a) => {
      const amount = a.amount ?? (a as any).balance ?? 0;
      return sum + amount * getPrice(a.coin);
    }, 0),
    [assets, tickers]
  );

  const fmt = (val: number) =>
    hideBalances ? "******" : `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtCoin = (val: number) =>
    hideBalances ? "******" : val.toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/dashboard?profile=open")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
          <FiArrowLeft size={22} className="text-[#eaecef]" />
        </button>
        <h1 className="text-lg font-bold text-white">Spot Account</h1>
      </div>

      <div className="px-4 pt-4 pb-8">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-[#1e2329] p-1 mb-6">
          <button onClick={() => router.push("/profile/funding")} className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition text-[#848e9c] hover:text-white">
            Funding
          </button>
          <button className="flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition bg-[#2b3139] text-white shadow cursor-default">
            Spot
          </button>
        </div>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-[#161a1e] to-[#0b0e11] p-6 shadow-xl border border-white/[0.04] relative overflow-hidden mb-8">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className="text-[#848e9c] text-sm font-medium">Est. Total Balance</span>
            <button onClick={() => setHideBalances(!hideBalances)} className="text-[#848e9c] hover:text-white transition p-1">
              {hideBalances ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">{fmt(totalUsd)}</h2>
            {!hideBalances && <span className="text-[#848e9c] font-medium">USD</span>}
          </div>
          <div className="mt-1 relative z-10 text-sm">
            <span className="text-[#848e9c]">≈ {fmtCoin(totalUsd / (getPrice("BTC") || 65000))} BTC</span>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mt-8 relative z-10">
            {[
              { icon: FiRepeat,  label: "Trade",    href: "/trade" as string | undefined, onClick: undefined },
              { icon: FiDownload, label: "Deposit",  href: "/deposit" as string | undefined, onClick: undefined },
              { icon: FiUpload,  label: "Withdraw", href: undefined, onClick: () => {} },
              { icon: FiRepeat,  label: "Transfer", href: undefined, onClick: () => setTransferOpen(true) },
            ].map((action, i) => {
              const inner = (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                    <action.icon size={20} />
                  </div>
                  <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">{action.label}</span>
                </>
              );
              return action.href ? (
                <Link key={i} href={action.href} className="flex flex-col items-center gap-2 group">{inner}</Link>
              ) : (
                <button key={i} onClick={action.onClick} className="flex flex-col items-center gap-2 group">{inner}</button>
              );
            })}
          </div>
        </motion.div>

        {/* Asset List */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Assets</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
                    <div className="space-y-2">
                      <div className="w-12 h-3.5 rounded bg-white/[0.06]" />
                      <div className="w-20 h-3 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 items-end flex flex-col">
                      <div className="w-16 h-3.5 rounded bg-white/[0.06]" />
                      <div className="w-12 h-3 rounded bg-white/[0.06]" />
                    </div>
                    <div className="space-y-2 items-end flex flex-col">
                      <div className="w-14 h-3.5 rounded bg-white/[0.06]" />
                      <div className="w-12 h-3 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {assets.map((asset) => {
                const price = getPrice(asset.coin);
                const change = getChange(asset.coin);
                const amount = asset.amount ?? (asset as any).balance ?? 0;
                const usdVal = amount * price;
                const positive = change >= 0;
                return (
                  <div key={asset.id}
                    onClick={() => router.push(`/profile/spot/${asset.coin.toLowerCase()}`)}
                    className="flex items-center gap-3 py-3.5 px-2 hover:bg-white/[0.02] rounded-xl transition cursor-pointer">
                    <div className="relative h-10 w-10 shrink-0">
                      <img src={COIN_LOGOS[asset.coin] ?? ""} alt={asset.coin}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0b0e11]"
                        style={{ background: COIN_COLORS[asset.coin] ?? "#848e9c" }} />
                    </div>

                    <div className="flex flex-1 min-w-0 justify-between items-center">
                      <div>
                        <p className="font-bold text-[#eaecef] leading-tight">{asset.coin}</p>
                        <p className="text-[11px] text-[#848e9c]">Market rate</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#eaecef] leading-tight">{fmtCoin(amount)}</p>
                        <p className="text-[11px] text-[#848e9c]">≈ {fmt(usdVal)}</p>
                      </div>
                    </div>

                    <div className="text-right ml-2 min-w-[60px]">
                      <p className={`text-[11px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}{change.toFixed(2)}%
                      </p>
                      <p className="text-[10px] text-[#848e9c]">
                        ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: asset.coin === "BTC" ? 0 : 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {assets.length === 0 && (
                <div className="py-12 text-center text-[#848e9c]"><p>No assets found.</p></div>
              )}
            </div>
          )}
        </div>
      </div>

      <TransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} defaultFrom="funding" />
    </div>
  );
}
