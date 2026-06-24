"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiActivity, FiDownload, FiUpload, FiRepeat } from "react-icons/fi";
import { motion } from "framer-motion";
import { subscribeSpotHoldings, SpotHolding, TransactionRecord } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { TransferModal } from "@/components/profile/TransferModal";
import Link from "next/link";
import { getClientFirestore } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import type { AppMarketPageData } from "@/lib/coingecko";

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

const getTypeIcon = (type: string) => {
  switch (type) {
    case "deposit": return <FiDownload className="text-green-500" />;
    case "withdrawal": return <FiUpload className="text-red-500" />;
    case "trade": return <FiActivity className="text-primary" />;
    case "transfer": return <FiRepeat className="text-blue-500" />;
    default: return <FiRepeat className="text-gray-400" />;
  }
};

export default function AssetDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const coinParam = typeof params.coin === "string" ? params.coin.toUpperCase() : "USDT";

  const [asset, setAsset] = useState<SpotHolding | null>(null);
  const [marketData, setMarketData] = useState<AppMarketPageData | null>(null);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      
      const unsubscribeSpot = subscribeSpotHoldings(user.uid, (data) => {
        const found = data.find(h => h.coin === coinParam);
        setAsset(found || null);
        setLoading(false);
      });

      const db = getClientFirestore();
      const q = query(
        collection(db, "transactions"), 
        where("userId", "==", user.uid), 
        where("coin", "==", coinParam), 
        orderBy("timestamp", "desc"), 
        limit(20)
      );

      const unsubscribeTx = onSnapshot(q, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransactionRecord)));
      }, (err) => console.error("Failed to subscribe to asset txs", err));

      return () => {
        unsubscribeSpot();
        unsubscribeTx();
      };
    }
  }, [user, coinParam]);

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
      }
    };
    fetchMarket();
  }, []);

  const marketCoin = marketData?.coins.find(c => c.symbol.toUpperCase() === coinParam);
  const currentPrice = marketCoin?.price || asset?.currentPrice || 0;
  const usdValue = asset ? (asset.value !== undefined ? asset.value : asset.amount * currentPrice) : 0;

  const formatUsd = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 shrink-0">
              <img
                src={COIN_LOGOS[coinParam] ?? `https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png`}
                alt={coinParam}
                className="h-6 w-6 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <h1 className="text-lg font-bold text-white">{coinParam}</h1>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 pb-8">
        {/* Main Asset Card */}
        {loading ? (
          <div className="animate-pulse h-40 bg-white/[0.04] rounded-2xl mb-8" />
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-6 shadow-lg mb-8 text-center relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <p className="text-[#848e9c] text-sm font-medium mb-1">Total Value</p>
            <h2 className="text-[32px] font-bold text-white tracking-tight leading-none mb-1">
              {formatUsd(usdValue)}
            </h2>
            <p className="text-[#848e9c] text-sm font-medium">{asset ? asset.amount : "0"} {coinParam}</p>
            
            {asset && asset.unrealizedPnl !== 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#848e9c] text-[11px] uppercase tracking-wide mb-1">Avg Entry</p>
                  <p className="text-sm font-medium text-white">{formatUsd(asset.avgBuyPrice)}</p>
                </div>
                <div>
                  <p className="text-[#848e9c] text-[11px] uppercase tracking-wide mb-1">Unrealized PnL</p>
                  <p className={`text-sm font-bold ${asset.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {asset.unrealizedPnl >= 0 ? "+" : ""}{formatUsd(asset.unrealizedPnl)}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Actions Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0b0e11]/90 backdrop-blur-xl border-t border-white/[0.04] pb-safe">
          <div className="flex gap-2 max-w-lg mx-auto">
            <Link href="/p2p/buy" className="flex-1 bg-primary text-[#0b0e11] py-3 rounded-xl font-bold hover:bg-primary/90 transition text-[15px] text-center">Buy</Link>
            <Link href="/p2p/sell" className="flex-1 bg-white/[0.06] text-white py-3 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-[15px] text-center">Sell</Link>
            <button onClick={() => setIsTransferModalOpen(true)} className="flex-1 bg-white/[0.06] text-white py-3 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-[15px]">Transfer</button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Recent Transactions</h3>
          {loading ? (
             <div className="animate-pulse space-y-4">
               {[1, 2].map(i => <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />)}
             </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-[#848e9c] text-sm">
              <p>No recent activity for {coinParam}.</p>
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#161a1e] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b0e11] border border-white/[0.04]">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-bold text-white capitalize text-[15px]">{tx.type}</p>
                      <p className="text-xs text-[#848e9c] mt-0.5">
                        {new Date(tx.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-[15px] ${tx.type === "deposit" || tx.type === "reward" ? "text-green-500" : "text-white"}`}>
                      {tx.type === "deposit" || tx.type === "reward" ? "+" : ""}{tx.amount}
                    </p>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${
                      tx.status === "completed" ? "text-green-500 bg-green-500/10 border-green-500/20" :
                      tx.status === "pending" ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" :
                      "text-red-500 bg-red-500/10 border-red-500/20"
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        defaultAsset={coinParam}
        defaultFrom="spot"
      />
    </div>
  );
}
