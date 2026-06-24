"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEye, FiEyeOff, FiDownload, FiUpload, FiRepeat, FiArrowDownLeft } from "react-icons/fi";
import { motion } from "framer-motion";
import { getFundingWallets, WalletAsset } from "@/lib/profile/wallet-service";
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

export default function FundingAccountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      getFundingWallets(user.uid).then((data) => {
        setAssets(data);
        setLoading(false);
      });
    }
  }, [user]);

  const totalUsd = assets.reduce((sum, asset) => sum + asset.usdValue, 0);

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
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <h1 className="text-lg font-bold text-white">Funding Account</h1>
        </div>
      </div>

      <div className="px-4 pt-6 pb-8">
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
            {[
              { icon: FiDownload, label: "Deposit" },
              { icon: FiUpload, label: "Withdraw" },
              { icon: FiRepeat, label: "Transfer" },
              { icon: FiArrowDownLeft, label: "Receive" },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center gap-2 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white transition group-hover:bg-primary group-hover:text-[#0b0e11]">
                  <action.icon size={20} />
                </div>
                <span className="text-xs font-semibold text-[#848e9c] group-hover:text-white transition">
                  {action.label}
                </span>
              </button>
            ))}
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
              {assets.map((asset) => (
                <motion.div 
                  key={asset.id} 
                  variants={itemVariants}
                  className="flex items-center justify-between py-3.5 px-2 hover:bg-white/[0.02] rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-inner ${getCoinColor(asset.coin)}`}>
                      {asset.coin.slice(0, 3)}
                    </div>
                    <div>
                      <p className="font-bold text-[#eaecef] leading-tight">{asset.coin}</p>
                      <p className="text-xs text-[#848e9c]">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#eaecef] leading-tight">{formatCrypto(asset.balance)}</p>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      <span className="text-[#848e9c]">{formatUsd(asset.usdValue)}</span>
                      {asset.change24h !== 0 && (
                        <span className={asset.change24h > 0 ? "text-green-500" : "text-red-500"}>
                          {asset.change24h > 0 ? "+" : ""}{asset.change24h}%
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {assets.length === 0 && (
                <div className="py-12 text-center text-[#848e9c]">
                  <p>No assets found.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
