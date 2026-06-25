"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiFilter, FiSearch, FiCalendar } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeTransactions, TransactionRecord } from "@/lib/profile/wallet-service";

const TABS = [
  { id: "open", label: "Open Orders" },
  { id: "history", label: "Order History" },
  { id: "trades", label: "Trade History" },
];

export default function SpotOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("history");
  const [trades, setTrades] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      const unsub = subscribeTransactions(user.uid, "trade", 100, (data) => {
        setTrades(data);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [user]);

  // Format date to Binance-like "MM-DD HH:mm:ss"
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const formatAmount = (amount: number, coin: string) => {
    const abs = Math.abs(amount);
    return abs.toLocaleString(undefined, { maximumFractionDigits: coin === "USDT" ? 2 : 6 });
  };

  const getPair = (tx: any) => {
    return `${tx.coin}/${tx.quoteCoin || "USDT"}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-safe flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0b0e11] px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/profile/spot")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
              <FiArrowLeft size={22} className="text-[#eaecef]" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">Spot Orders</h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-full text-[#848e9c] hover:bg-white/[0.06] hover:text-white transition">
              <FiSearch size={18} />
            </button>
            <button className="p-2 rounded-full text-[#848e9c] hover:bg-white/[0.06] hover:text-white transition">
              <FiFilter size={18} />
            </button>
          </div>
        </div>
        
        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-6 border-b border-white/[0.06]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-3 text-[15px] font-semibold transition relative ${
                activeTab === tab.id ? "text-white" : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeOrderTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 px-4 py-2">
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse flex gap-4 w-full">
                <div className="h-4 bg-white/[0.02] rounded w-16" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/[0.02] rounded w-full" />
                  <div className="h-4 bg-white/[0.02] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === "open" ? (
          // Open Orders Empty State
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
              <FiCalendar size={32} className="text-[#848e9c]" />
            </div>
            <p className="text-sm font-medium text-[#848e9c]">No open orders</p>
          </div>
        ) : trades.length === 0 ? (
          // Trade History Empty State
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mb-4">
              <FiCalendar size={32} className="text-[#848e9c]" />
            </div>
            <p className="text-sm font-medium text-[#848e9c]">No order history</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-2 pb-6">
            {trades.map((tx: any) => {
              const isBuy = tx.tradeSide === "buy";
              const price = tx.tradePrice || 0;
              const executedAmount = Math.abs(tx.amount || 0);
              const orderValue = tx.usdValue || 0;
              const statusColor = tx.status === "completed" ? "text-[#848e9c]" : tx.status === "failed" ? "text-red-500" : "text-yellow-500";

              return (
                <div key={tx.id} className="group border-b border-white/[0.04] pb-5 last:border-0 hover:bg-white/[0.01] transition-colors -mx-4 px-4 py-2 cursor-pointer">
                  {/* Top Row: Pair & Status */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[15px] font-bold ${isBuy ? "text-green-500" : "text-red-500"}`}>
                        {isBuy ? "Buy" : "Sell"}
                      </span>
                      <span className="text-[17px] font-bold text-white tracking-tight">{getPair(tx)}</span>
                    </div>
                    <span className="text-xs text-[#848e9c] bg-[#161a1e] px-2 py-0.5 rounded uppercase font-medium">
                      Market
                    </span>
                  </div>

                  {/* Middle Data Grid */}
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                    <div className="col-span-1">
                      <p className="text-xs text-[#848e9c] mb-1">Time</p>
                      <p className="text-[13px] font-medium text-white">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-xs text-[#848e9c] mb-1">Amount</p>
                      <p className="text-[13px] font-medium text-white">{formatAmount(executedAmount, tx.coin)}</p>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-xs text-[#848e9c] mb-1">Price</p>
                      <p className="text-[13px] font-medium text-white">{formatAmount(price, tx.quoteCoin || "USDT")}</p>
                    </div>
                  </div>

                  {/* Bottom Row: Total Value */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#848e9c]">Status</span>
                      <span className={`text-xs font-semibold capitalize ${statusColor}`}>
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#848e9c] mr-2">Total</span>
                      <span className="text-[14px] font-bold text-white tracking-tight">
                        {formatAmount(orderValue, tx.quoteCoin || "USDT")} <span className="text-xs font-normal text-[#848e9c]">{tx.quoteCoin || "USDT"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
