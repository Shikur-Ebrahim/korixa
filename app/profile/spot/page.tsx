"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPieChart, FiTrendingUp, FiTrendingDown, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { TransferModal } from "@/components/profile/TransferModal";
import Link from "next/link";

const getCoinColor = (coin: string) => {
  switch (coin) {
    case "BTC": return "bg-[#F7931A] text-white";
    case "ETH": return "bg-[#627EEA] text-white";
    case "USDT": return "bg-[#26A17B] text-white";
    case "SOL": return "bg-[#14F195] text-[#0b0e11]";
    case "BNB": return "bg-[#F3BA2F] text-[#0b0e11]";
    default: return "bg-gray-700 text-white";
  }
};

export default function SpotAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<SpotHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      const unsubscribe = subscribeSpotHoldings(user.uid, (data) => {
        setHoldings(data);
        setLoading(false);
        setIsRefreshing(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // The subscription will automatically push new data if it changes, 
    // but we simulate a refresh state for UX.
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const formatUsd = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard?profile=open")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <h1 className="text-lg font-bold text-white">Spot Account</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className={`p-1.5 text-[#848e9c] hover:text-white transition ${isRefreshing ? "animate-spin" : ""}`}>
            <FiRefreshCw size={18} />
          </button>
          <button className="text-[#848e9c] hover:text-white p-1.5"><FiPieChart size={20} /></button>
        </div>
      </div>

      <div className="px-4 pt-6 pb-8">
        {/* Portfolio Summary Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 shadow-lg">
          <p className="text-[#848e9c] text-sm font-medium mb-1">Portfolio Value</p>
          <h2 className="text-[28px] font-bold text-white tracking-tight leading-none">{formatUsd(totalValue)}</h2>
          
          <div className="mt-4 flex items-center gap-4">
            <div>
              <p className="text-[#848e9c] text-xs mb-0.5">Today's PnL</p>
              <p className={`font-bold text-sm flex items-center gap-1 ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {totalPnl >= 0 ? <FiTrendingUp size={14} /> : <FiTrendingDown size={14} />}
                {totalPnl >= 0 ? "+" : ""}{formatUsd(totalPnl)}
              </p>
            </div>
            <div className="w-[1px] h-8 bg-white/[0.06]" />
            <div>
              <p className="text-[#848e9c] text-xs mb-0.5">PnL %</p>
              <p className={`font-bold text-sm ${pnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                {pnlPercent >= 0 ? "+" : ""}{pnlPercent.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto scrollbar-hide pb-1">
            <Link href="/p2p/buy" className="whitespace-nowrap px-4 bg-primary text-[#0b0e11] py-2 rounded-xl font-bold hover:bg-primary/90 transition text-[15px]">Buy</Link>
            <Link href="/p2p/sell" className="whitespace-nowrap px-4 bg-white/[0.06] text-white py-2 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-[15px]">Sell</Link>
            <Link href="/deposit" className="whitespace-nowrap px-4 bg-white/[0.06] text-white py-2 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-[15px]">Deposit</Link>
            <button onClick={() => setIsTransferModalOpen(true)} className="whitespace-nowrap px-4 bg-white/[0.06] text-white py-2 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-[15px]">Transfer</button>
          </div>
        </motion.div>

        {/* Holdings */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Asset Holdings</h3>

          {loading ? (
             <div className="animate-pulse space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/[0.04] rounded-xl" />)}
             </div>
          ) : holdings.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-[#161a1e] rounded-2xl border border-white/[0.04]">
              <div className="w-16 h-16 bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
                <FiPieChart className="text-[#848e9c]" size={24} />
              </div>
              <h4 className="text-white font-bold mb-2">Your Spot Wallet is Empty</h4>
              <p className="text-[#848e9c] text-sm max-w-[200px] mb-6">Deposit or buy crypto to start building your portfolio.</p>
              <div className="flex gap-3">
                <Link href="/deposit" className="px-6 py-2 bg-white/[0.06] rounded-lg text-sm font-bold text-white hover:bg-white/[0.1] transition border border-white/[0.04]">Deposit</Link>
                <Link href="/p2p/buy" className="px-6 py-2 bg-primary rounded-lg text-sm font-bold text-[#0b0e11] hover:bg-primary/90 transition">Buy Crypto</Link>
              </div>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {holdings.map((h) => (
                <Link key={h.id} href={`/profile/spot/${h.coin.toLowerCase()}`} className="block">
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="rounded-xl border border-white/[0.04] bg-[#161a1e] p-4 hover:border-white/[0.1] transition">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold shadow-inner ${getCoinColor(h.coin)}`}>
                          {h.coin.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-[16px]">{h.coin}</span>
                          <p className="text-[13px] text-[#848e9c]">Available: {h.amount}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-[16px]">{formatUsd(h.value)}</p>
                        <p className="text-[13px] text-[#848e9c]">{formatUsd(h.currentPrice)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/[0.04]">
                      <div>
                        <p className="text-[11px] text-[#848e9c] uppercase tracking-wide mb-0.5">Avg Price</p>
                        <p className="text-[13px] font-medium text-[#eaecef]">{formatUsd(h.avgBuyPrice)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[#848e9c] uppercase tracking-wide mb-0.5">Unrealized PnL</p>
                        <p className={`text-[13px] font-bold ${h.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {h.unrealizedPnl >= 0 ? "+" : ""}{formatUsd(h.unrealizedPnl)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        defaultFrom="funding"
      />
    </div>
  );
}
