"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPieChart, FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { motion } from "framer-motion";
import { getSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";

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

  useEffect(() => {
    if (user?.uid) {
      getSpotHoldings(user.uid).then((data) => {
        // Mock some data if empty to show the UI
        if (data.length === 0) {
          setHoldings([
            { id: "1", coin: "BTC", amount: 0.15, avgBuyPrice: 42000, currentPrice: 65000, unrealizedPnl: 3450, value: 9750 },
            { id: "2", coin: "ETH", amount: 4.2, avgBuyPrice: 2200, currentPrice: 3400, unrealizedPnl: 5040, value: 14280 },
            { id: "3", coin: "SOL", amount: 150, avgBuyPrice: 85, currentPrice: 140, unrealizedPnl: 8250, value: 21000 },
          ]);
        } else {
          setHoldings(data);
        }
        setLoading(false);
      });
    }
  }, [user]);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalPnl = holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const formatUsd = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
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
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <h1 className="text-lg font-bold text-white">Spot Account</h1>
        </div>
        <button className="text-[#848e9c] hover:text-white p-1.5"><FiPieChart size={20} /></button>
      </div>

      <div className="px-4 pt-6 pb-8">
        {/* Portfolio Summary Card */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 shadow-lg">
          <p className="text-[#848e9c] text-sm font-medium mb-1">Portfolio Value</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">{formatUsd(totalValue)}</h2>
          
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

          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-primary text-[#0b0e11] py-2.5 rounded-xl font-bold hover:bg-primary/90 transition text-sm">Buy</button>
            <button className="flex-1 bg-white/[0.06] text-white py-2.5 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-sm">Sell</button>
            <button className="flex-1 bg-white/[0.06] text-white py-2.5 rounded-xl font-bold hover:bg-white/[0.1] transition border border-white/[0.04] text-sm">Convert</button>
          </div>
        </motion.div>

        {/* Holdings */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4">Holdings</h3>

          {loading ? (
             <div className="animate-pulse space-y-4">
               {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/[0.04] rounded-xl" />)}
             </div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
              {holdings.map((h) => (
                <motion.div key={h.id} variants={itemVariants} className="rounded-xl border border-white/[0.04] bg-[#161a1e] p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${getCoinColor(h.coin)}`}>
                        {h.coin.slice(0, 3)}
                      </div>
                      <span className="font-bold text-white text-base">{h.coin}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{formatUsd(h.value)}</p>
                      <p className="text-xs text-[#848e9c]">{h.amount} {h.coin}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.04]">
                    <div>
                      <p className="text-[10px] text-[#848e9c] uppercase mb-0.5">Avg Price</p>
                      <p className="text-xs font-medium text-[#eaecef]">{formatUsd(h.avgBuyPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#848e9c] uppercase mb-0.5">Current</p>
                      <p className="text-xs font-medium text-[#eaecef]">{formatUsd(h.currentPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#848e9c] uppercase mb-0.5">Unrealized PnL</p>
                      <p className={`text-xs font-bold ${h.unrealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {h.unrealizedPnl >= 0 ? "+" : ""}{formatUsd(h.unrealizedPnl)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
