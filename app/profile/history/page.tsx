"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiDownload, FiUpload, FiRepeat, FiActivity, FiGift, FiChevronRight, FiX, FiExternalLink, FiCopy, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getTransactions, TransactionRecord, TransactionType } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";

const TABS = [
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "trade", label: "Trades" },
  { id: "transfer", label: "Transfers" }
];

const getTypeIcon = (type: string) => {
  if (["deposit", "crypto_deposit", "p2p_buy"].includes(type)) return <FiDownload className="text-green-500" />;
  if (["withdrawal", "p2p_sell"].includes(type)) return <FiUpload className="text-red-500" />;
  if (type === "trade") return <FiActivity className="text-primary" />;
  if (type === "transfer") return <FiRepeat className="text-blue-500" />;
  if (type === "reward") return <FiGift className="text-purple-500" />;
  return <FiRepeat className="text-gray-400" />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return "text-green-500 bg-green-500/10 border-green-500/20";
    case "pending": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "failed": return "text-red-500 bg-red-500/10 border-red-500/20";
    default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  }
};

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deposit");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      setLoading(true);
      let typeFilter: TransactionType | TransactionType[] | undefined;
      if (activeTab === "deposit") typeFilter = ["deposit", "crypto_deposit", "p2p_buy"];
      else if (activeTab === "withdrawal") typeFilter = ["withdrawal", "p2p_sell"];
      else if (activeTab === "trade") typeFilter = "trade";
      else if (activeTab === "transfer") typeFilter = "transfer";
      
      getTransactions(user.uid, typeFilter).then((data) => {
        if (data.length === 0 && activeTab === "deposit") {
          // Mock some initial data for demonstration if they just signed up
          setTransactions([
            { id: "tx1", type: "deposit", coin: "USDT", amount: 1500, usdValue: 1500, status: "completed", timestamp: Date.now() - 3600000, txId: "0x1a2b3c4d5e6f...", network: "TRC20", fee: 1, confirmations: 12 },
          ]);
        } else {
          setTransactions(data);
        }
        setLoading(false);
      });
    }
  }, [user, activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-10">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0b0e11] border-b border-white/[0.04] px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push("/dashboard?profile=open")} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <h1 className="text-lg font-bold text-white">Transaction History</h1>
        </div>
        
        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-3 text-sm font-semibold transition relative ${
                activeTab === tab.id ? "text-primary" : "text-[#848e9c] hover:text-[#eaecef]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="animate-pulse h-20 bg-white/[0.02] rounded-xl" />)
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-[#848e9c]">
            <p>No transactions found.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {transactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTx(tx)}
                className="flex items-center justify-between p-4 rounded-xl bg-[#161a1e] border border-white/[0.04] hover:border-white/[0.1] transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0b0e11] border border-white/[0.04]">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-bold text-white capitalize">{tx.type}</p>
                    <p className="text-xs text-[#848e9c] mt-0.5">
                      {new Date(tx.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-base ${["deposit", "reward", "crypto_deposit", "p2p_buy"].includes(tx.type) ? "text-green-500" : "text-white"}`}>
                    {["deposit", "reward", "crypto_deposit", "p2p_buy"].includes(tx.type) ? "+" : ""}{tx.amount} {tx.coin}
                  </p>
                  <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTx(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#161a1e] border-t border-white/[0.06] p-6 pb-safe"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white capitalize">{selectedTx.type} Details</h3>
                <button onClick={() => setSelectedTx(null)} className="p-2 -mr-2 text-[#848e9c] hover:text-white transition"><FiX size={24} /></button>
              </div>

              <div className="text-center mb-8">
                <p className={`text-3xl font-bold ${selectedTx.type === "deposit" ? "text-green-500" : "text-white"}`}>
                  {selectedTx.type === "deposit" ? "+" : ""}{selectedTx.amount} {selectedTx.coin}
                </p>
                <p className="text-[#848e9c] mt-1 text-sm">≈ ${selectedTx.usdValue.toLocaleString()}</p>
                <span className={`inline-block mt-3 px-2.5 py-1 text-xs font-bold uppercase rounded border ${getStatusColor(selectedTx.status)}`}>
                  {selectedTx.status}
                </span>
              </div>

              <div className="space-y-4 text-sm bg-[#0b0e11] rounded-2xl p-4 border border-white/[0.04]">
                <div className="flex justify-between py-1">
                  <span className="text-[#848e9c]">Date</span>
                  <span className="text-white font-medium">{new Date(selectedTx.timestamp).toLocaleString()}</span>
                </div>
                {selectedTx.network && (
                  <div className="flex justify-between py-1">
                    <span className="text-[#848e9c]">Network</span>
                    <span className="text-white font-medium">{selectedTx.network}</span>
                  </div>
                )}
                {selectedTx.fee !== undefined && (
                  <div className="flex justify-between py-1">
                    <span className="text-[#848e9c]">Fee</span>
                    <span className="text-white font-medium">{selectedTx.fee} {selectedTx.coin}</span>
                  </div>
                )}
                {selectedTx.txId && (
                  <div className="flex justify-between py-1 items-start">
                    <span className="text-[#848e9c]">TxID</span>
                    <div className="flex items-center gap-2 max-w-[60%]">
                      <span className="text-white font-medium truncate">{selectedTx.txId}</span>
                      <button onClick={() => copyToClipboard(selectedTx.txId!)} className="text-[#848e9c] hover:text-primary transition">
                        {copiedId ? <FiCheck className="text-green-500" /> : <FiCopy />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                <button className="text-primary text-sm font-bold flex items-center gap-2 hover:underline">
                  View on Explorer <FiExternalLink />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
