"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSearch, FiCheckSquare, FiSquare, FiX, FiArrowRight } from "react-icons/fi";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";

export default function CryptoWithdrawSelectCoinPage() {
  const router = useRouter();
  const { fundingWallets, loading } = useFirestoreAssetsData();
  const [search, setSearch] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [showTypeDrawer, setShowTypeDrawer] = useState(false);

  // We only show virtual USDT in funding
  const filteredWallets = fundingWallets.filter(w => {
    if (hideZero && w.balance === 0) return false;
    if (search && !w.coin.toLowerCase().includes(search.toLowerCase()) && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    // Only allow USDT for now based on requirements
    return w.coin === "USDT";
  });

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-white">
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Select Coin</h1>
        </div>
      </div>

      <div className="px-4 py-2">
        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" size={18} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#161a1e] py-2.5 pl-10 pr-4 text-sm text-white placeholder-[#848e9c] outline-none border border-transparent focus:border-white/[0.08] transition"
          />
        </div>

        {/* Hide Zero Balances */}
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setHideZero(!hideZero)} className="flex items-center gap-2 text-[#848e9c] hover:text-white transition">
            {hideZero ? <FiCheckSquare size={16} className="text-primary" /> : <FiSquare size={16} />}
            <span className="text-sm font-medium">Hide zero balances</span>
          </button>
        </div>

        {/* Coin List */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-12 bg-white/5 rounded" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWallets.length === 0 ? (
            <p className="text-center text-sm text-[#848e9c] py-10">No coins available for withdrawal</p>
          ) : (
            filteredWallets.map((w) => (
              <button
                key={w.id}
                onClick={() => setShowTypeDrawer(true)}
                className="w-full flex items-center justify-between p-2 hover:bg-white/[0.02] rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329]">
                    {/* Placeholder image for USDT */}
                    <img src="https://assets.coingecko.com/coins/images/325/thumb/Tether.png" alt="USDT" className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-white">{w.coin}</p>
                    <p className="text-xs text-[#848e9c]">{w.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{w.balance.toFixed(4)}</p>
                  <p className="text-xs text-[#848e9c]">≈ {w.balance.toFixed(2)} USD</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Type Drawer */}
      {showTypeDrawer && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setShowTypeDrawer(false)}
        >
          <div 
            className="animate-slide-up w-full rounded-t-3xl bg-[#161a1e] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Withdraw</h2>
              <button onClick={() => setShowTypeDrawer(false)} className="p-1 text-[#848e9c] hover:text-white transition">
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/profile/withdraw/crypto/onchain")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.04]"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white">On-Chain</p>
                  <p className="text-[11px] text-[#848e9c] mt-0.5">Withdrawal to an on-chain address</p>
                </div>
                <FiArrowRight size={16} className="text-[#848e9c]" />
              </button>

              <button
                onClick={() => router.push("/profile/withdraw/crypto/internal")}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.04]"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Internal Transfer</p>
                  <p className="text-[11px] text-[#848e9c] mt-0.5">Withdraw via Korixa UID/email/mobile — 0 fee</p>
                </div>
                <FiArrowRight size={16} className="text-[#848e9c]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
