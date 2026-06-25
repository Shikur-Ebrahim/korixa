"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiEye, FiEyeOff, FiTrendingUp, FiTrendingDown,
  FiArrowDownLeft, FiArrowUpRight, FiRepeat, FiClock,
  FiChevronRight, FiDollarSign, FiPieChart,
} from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";
import { TransferModal } from "@/components/profile/TransferModal";

const COIN_COLORS: Record<string, string> = {
  BTC: "#F7931A",
  ETH: "#627EEA",
  USDT: "#26A17B",
  SOL: "#9945FF",
  BNB: "#F3BA2F",
};

const COIN_LOGOS: Record<string, string> = {
  BTC:  "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
  ETH:  "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
  USDT: "https://assets.coingecko.com/coins/images/325/thumb/Tether.png",
  SOL:  "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
  BNB:  "https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png",
};

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCoin(n: number) {
  if (n === 0) return "0";
  if (n < 0.0001) return n.toFixed(8);
  if (n < 1) return n.toFixed(6);
  return fmt(n, 4);
}

export function AssetsScreenFirestore() {
  const router = useRouter();
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "funding" | "spot">("all");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const {
    fundingWallets,
    spotHoldings,
    loading,
    getPrice,
    getChange,
    fundingTotal,
    spotTotal,
    totalValue,
  } = useFirestoreAssetsData();

  const blur = hideBalance ? "blur-sm select-none" : "";

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FiDollarSign size={48} className="text-[#848e9c]" />
        <p className="text-[#848e9c] text-sm">Please sign in to view your assets</p>
        <Link href="/sign-in" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-[#0b0e11]">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">

      {/* ── Portfolio Header Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2035] via-[#151a26] to-[#0f1218] border border-white/[0.07] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
        {/* glow */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-blue-500/8 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium tracking-widest text-[#848e9c] uppercase">Total Balance</p>
              {loading ? (
                <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-white/5" />
              ) : (
                <p className={`mt-1 text-[2.2rem] font-bold leading-none tracking-tight text-white ${blur}`}>
                  ${fmt(totalValue)}
                  <span className="ml-2 text-sm font-normal text-[#848e9c]">USD</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setHideBalance(v => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0b0e11]/60 text-[#848e9c] hover:text-white transition"
            >
              {hideBalance ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>

          {/* Sub-totals */}
          {!loading && (
            <div className="mt-4 flex gap-4">
              <div className="flex-1 rounded-xl bg-black/30 p-3">
                <p className="text-[10px] text-[#848e9c] font-medium uppercase tracking-wide">Funding</p>
                <p className={`mt-0.5 text-sm font-bold text-white ${blur}`}>${fmt(fundingTotal)}</p>
              </div>
              <div className="flex-1 rounded-xl bg-black/30 p-3">
                <p className="text-[10px] text-[#848e9c] font-medium uppercase tracking-wide">Spot</p>
                <p className={`mt-0.5 text-sm font-bold text-white ${blur}`}>${fmt(spotTotal)}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { icon: FiArrowDownLeft, label: "Deposit",  color: "text-green-400",  onClick: () => router.push("?deposit=open") },
              { icon: FiArrowUpRight,  label: "Withdraw", color: "text-red-400",    onClick: () => router.push("/profile/funding") },
              { icon: FiRepeat,        label: "Transfer", color: "text-blue-400",   onClick: () => setIsTransferModalOpen(true) },
              { icon: FiClock,         label: "History",  color: "text-[#848e9c]", onClick: () => router.push("/profile/history") },
            ].map(({ icon: Icon, label, color, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] py-3 transition hover:bg-white/[0.07]"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-black/30 ${color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-medium text-[#848e9c]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl bg-[#1e2329] p-1">
        {(["all", "funding", "spot"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${
              activeTab === tab
                ? "bg-[#2b3139] text-white shadow"
                : "text-[#848e9c] hover:text-white"
            }`}
          >
            {tab === "all" ? "All Assets" : tab === "funding" ? "Funding" : "Spot"}
          </button>
        ))}
      </div>

      {/* ── Funding Wallet ── */}
      {(activeTab === "all" || activeTab === "funding") && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1f] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FiDollarSign size={15} className="text-primary" />
              <span className="text-sm font-bold text-white">Funding Wallet</span>
            </div>
            <Link href="/profile/funding" className="flex items-center gap-1 text-[11px] text-primary font-medium">
              Manage <FiChevronRight size={12} />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                      <div className="h-2.5 w-16 animate-pulse rounded bg-white/5" />
                    </div>
                    <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                  </div>
                ))
              : fundingWallets.map(w => {
                  const price = getPrice(w.coin);
                  const change = getChange(w.coin);
                  const usdVal = (w.balance ?? 0) * price;
                  const positive = change >= 0;

                  return (
                    <div key={w.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.02]">
                      <div className="relative h-9 w-9 shrink-0">
                        <img
                          src={COIN_LOGOS[w.coin] ?? `https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png`}
                          alt={w.coin}
                          className="h-9 w-9 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#161a1f]"
                          style={{ background: COIN_COLORS[w.coin] ?? "#848e9c" }}
                        />
                      </div>

                      <div className="flex flex-1 min-w-0 justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-white">{w.coin}</p>
                          <p className="text-[11px] text-[#848e9c]">{w.name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold text-white ${blur}`}>
                            {fmtCoin(w.balance ?? 0)}
                          </p>
                          <p className={`text-[11px] text-[#848e9c] ${blur}`}>
                            ≈ ${fmt(usdVal)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right ml-2">
                        <p className={`text-[11px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                          {positive ? "+" : ""}{fmt(change, 2)}%
                        </p>
                        <p className="text-[10px] text-[#848e9c]">${fmt(price, w.coin === "BTC" ? 0 : 2)}</p>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* ── Spot Wallet ── */}
      {(activeTab === "all" || activeTab === "spot") && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1f] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FiPieChart size={15} className="text-blue-400" />
              <span className="text-sm font-bold text-white">Spot Account</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/trade")}
                className="text-[11px] font-semibold text-primary"
              >
                Trade →
              </button>
              <Link href="/profile/spot" className="flex items-center gap-1 text-[11px] text-[#848e9c] font-medium">
                Manage <FiChevronRight size={12} />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-white/5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
                      <div className="h-2.5 w-16 animate-pulse rounded bg-white/5" />
                    </div>
                    <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
                  </div>
                ))
              : spotHoldings.map(h => {
                  const price = getPrice(h.coin);
                  const change = getChange(h.coin);
                  const usdVal = (h.amount ?? 0) * price;
                  const positive = change >= 0;
                  const pnl = h.avgBuyPrice > 0
                    ? ((price - h.avgBuyPrice) / h.avgBuyPrice) * 100
                    : null;

                  return (
                    <div key={h.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.02]">
                      <div className="relative h-9 w-9 shrink-0">
                        <img
                          src={COIN_LOGOS[h.coin] ?? ""}
                          alt={h.coin}
                          className="h-9 w-9 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#161a1f]"
                          style={{ background: COIN_COLORS[h.coin] ?? "#848e9c" }}
                        />
                      </div>

                      <div className="flex flex-1 min-w-0 justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-white">{h.coin}</p>
                          {pnl !== null ? (
                            <p className={`text-[11px] font-medium ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {pnl >= 0 ? "+" : ""}{fmt(pnl)}% PnL
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#848e9c]">Market rate</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold text-white ${blur}`}>
                            {fmtCoin(h.amount ?? 0)}
                          </p>
                          <p className={`text-[11px] text-[#848e9c] ${blur}`}>
                            ≈ ${fmt(usdVal)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right ml-2">
                        <p className={`text-[11px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                          {positive ? "+" : ""}{fmt(change, 2)}%
                        </p>
                        <p className="text-[10px] text-[#848e9c]">${fmt(price, h.coin === "BTC" ? 0 : 2)}</p>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/trade"
          className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3 transition hover:bg-green-500/[0.1]"
        >
          <FiTrendingUp size={18} className="text-green-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">Spot Trade</p>
            <p className="text-[10px] text-[#848e9c]">Buy & sell crypto</p>
          </div>
        </Link>
        <Link
          href="/p2p"
          className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/[0.06] px-4 py-3 transition hover:bg-blue-500/[0.1]"
        >
          <FiTrendingDown size={18} className="text-blue-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white">P2P Trade</p>
            <p className="text-[10px] text-[#848e9c]">Trade with locals</p>
          </div>
        </Link>
      </div>

      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        defaultFrom={activeTab === "spot" ? "spot" : "funding"} 
      />
    </div>
  );
}
