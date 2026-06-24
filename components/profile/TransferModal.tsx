"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiRepeat, FiChevronDown } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { executeTransfer } from "@/lib/profile/transfer-actions";
import { getFundingWallets, getSpotHoldings, WalletAsset } from "@/lib/profile/wallet-service";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultAsset?: string;
  defaultFrom?: "funding" | "spot";
};

export function TransferModal({ isOpen, onClose, defaultAsset = "USDT", defaultFrom = "funding" }: TransferModalProps) {
  const { user, getIdToken } = useAuth();
  const [fromAccount, setFromAccount] = useState<"funding" | "spot">(defaultFrom);
  const [asset, setAsset] = useState(defaultAsset);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableAssets, setAvailableAssets] = useState<WalletAsset[]>([]);

  const toAccount = fromAccount === "funding" ? "spot" : "funding";

  useEffect(() => {
    if (isOpen && user?.uid) {
      // Load balances for the selected source account
      if (fromAccount === "funding") {
        getFundingWallets(user.uid).then(setAvailableAssets);
      } else {
        // We can safely cast SpotHolding to WalletAsset for the fields we need here (balance, coin)
        getSpotHoldings(user.uid).then(res => setAvailableAssets(res as unknown as WalletAsset[]));
      }
    }
  }, [isOpen, user, fromAccount]);

  // Find the selected asset's available balance
  const selectedAssetData = availableAssets.find(a => a.coin === asset);
  const maxAvailable = selectedAssetData?.availableBalance || 0;

  const handleSwap = () => {
    setFromAccount(toAccount);
    setAmount("");
    setError(null);
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (parseFloat(amount) > maxAvailable) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      await executeTransfer(token, asset, parseFloat(amount), fromAccount, toAccount);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />
        <motion.div 
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="relative w-full max-w-md bg-[#161a1e] rounded-t-3xl sm:rounded-3xl border border-white/[0.06] p-6 pb-safe sm:pb-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Transfer</h3>
            <button onClick={onClose} className="p-2 -mr-2 text-[#848e9c] hover:text-white transition"><FiX size={24} /></button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Accounts Selector */}
          <div className="relative flex items-stretch gap-4 p-4 rounded-xl border border-white/[0.04] bg-[#0b0e11] mb-6">
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-[1px] h-8 bg-white/[0.06] my-1" />
              <div className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">From</span>
                <span className="text-white font-medium capitalize">{fromAccount} Account</span>
              </div>
              <div className="h-[1px] w-full bg-white/[0.04]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">To</span>
                <span className="text-white font-medium capitalize">{toAccount} Account</span>
              </div>
            </div>

            <button 
              onClick={handleSwap}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white transition"
            >
              <FiRepeat size={18} />
            </button>
          </div>

          {/* Coin Selector (Simplified) */}
          <div className="mb-4">
            <label className="text-xs text-[#848e9c] font-medium mb-1.5 block">Asset</label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-[#0b0e11] cursor-pointer hover:border-white/[0.1] transition">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F7931A] text-white flex items-center justify-center text-[8px] font-bold">
                  {asset}
                </div>
                <span className="text-white font-medium">{asset}</span>
              </div>
              <FiChevronDown className="text-[#848e9c]" />
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-1.5">
              <label className="text-xs text-[#848e9c] font-medium">Amount</label>
              <span className="text-xs text-[#848e9c]">Available: {maxAvailable} {asset}</span>
            </div>
            <div className="relative">
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0b0e11] border border-white/[0.04] rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-primary transition placeholder:text-white/[0.1]"
              />
              <button 
                onClick={() => setAmount(maxAvailable.toString())}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm px-2 py-1 hover:bg-primary/10 rounded transition"
              >
                Max
              </button>
            </div>
          </div>

          <button 
            onClick={handleTransfer}
            disabled={loading}
            className="w-full bg-primary text-[#0b0e11] font-bold py-3.5 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Confirming..." : "Confirm Transfer"}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
