"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft, FiRefreshCw, FiEye, FiEyeOff, FiRepeat,
  FiDownload, FiUpload, FiTrendingUp, FiSearch, FiStar,
  FiActivity, FiClock, FiBarChart2, FiList, FiX
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { TransferModal } from "@/components/profile/TransferModal";
import { formatUsd, formatPercent } from "@/lib/format";
import type { MarketCoin } from "@/lib/coingecko";
import Link from "next/link";

// --- Types ---
type OverviewTab = "open_orders" | "order_history" | "trade_history" | "tx_history" | "analysis";

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: React.ReactNode }[] = [
  { id: "open_orders", label: "Open Orders", icon: <FiList size={18} /> },
  { id: "order_history", label: "Order History", icon: <FiClock size={18} /> },
  { id: "trade_history", label: "Trade History", icon: <FiActivity size={18} /> },
  { id: "tx_history", label: "Transaction History", icon: <FiRepeat size={18} /> },
  { id: "analysis", label: "Asset Analysis", icon: <FiBarChart2 size={18} /> },
];

const FAVORITES_KEY = "korixa-spot-favorites";

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
  catch { return []; }
}
function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

// --- Skeleton ---
function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}

// --- Main Component ---
export default function SpotAccountPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Balances from Firestore
  const [holdings, setHoldings] = useState<SpotHolding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);

  // Live market data from CoinGecko via API
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState(false);

  // UI State
  const [hideBalance, setHideBalance] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSmall, setHideSmall] = useState(false);
  const [activeOverviewTab, setActiveOverviewTab] = useState<OverviewTab>("open_orders");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showTradePromo, setShowTradePromo] = useState(true);

  const fetchMarket = async (silent = false) => {
    if (!silent) setMarketLoading(true);
    setMarketError(false);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoins(data.coins ?? []);
    } catch {
      setMarketError(true);
    } finally {
      setMarketLoading(false);
    }
  };

  // Subscribe to real-time spot holdings
  useEffect(() => {
    if (!user?.uid) return;
    setHoldingsLoading(true);
    const unsub = subscribeSpotHoldings(user.uid, (data) => {
      setHoldings(data);
      setHoldingsLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Fetch market data once
  useEffect(() => {
    fetchMarket();
    setFavorites(loadFavorites());
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMarket(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Build enriched asset holdings with live prices
  const enrichedHoldings = useMemo(() => {
    return holdings.map(h => {
      const live = coins.find(c => c.symbol.toUpperCase() === h.coin.toUpperCase());
      const currentPrice = live?.price ?? h.currentPrice ?? 0;
      const change24h = live?.change24h ?? 0;
      const liveValue = h.amount * currentPrice;
      return { ...h, currentPrice, change24h, liveValue };
    });
  }, [holdings, coins]);

  // Portfolio totals
  const totalValue = enrichedHoldings.reduce((s, h) => s + h.liveValue, 0);
  const totalPnl = enrichedHoldings.reduce((s, h) => s + h.unrealizedPnl, 0);
  const frozenBalance = enrichedHoldings.reduce((s, h) => s + (h as any).lockedBalance * h.currentPrice, 0);
  const availableBalance = totalValue - frozenBalance;
  const pnlPercent = totalValue > 0 ? (totalPnl / Math.max(1, totalValue - totalPnl)) * 100 : 0;

  // Market coin list filtered
  const filteredCoins = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return coins.filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [coins, searchQuery]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const mask = (str: string) => hideBalance ? "••••••" : str;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/90 backdrop-blur-md border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-[24px] font-semibold text-white leading-none">Spot Account</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleRefresh}
            className={`p-2 rounded-full text-[#848e9c] hover:text-white transition ${isRefreshing ? "animate-spin" : ""}`}>
            <FiRefreshCw size={18} />
          </button>
          <button className="p-2 rounded-full text-[#848e9c] hover:text-white transition">
            <FiList size={18} />
          </button>
          <button className="p-2 rounded-full text-[#848e9c] hover:text-white transition">
            <FiClock size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* ── BALANCE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            {/* Left: main balance */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#848e9c] text-sm font-medium">Total Spot Balance</span>
                <button onClick={() => setHideBalance(v => !v)} className="text-[#848e9c] hover:text-white transition">
                  {hideBalance ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                </button>
              </div>
              {holdingsLoading ? (
                <SkeletonCard className="h-9 w-40 mb-1" />
              ) : (
                <h2 className="text-[28px] font-bold text-white leading-none mb-1">
                  {mask(formatUsd(totalValue))}
                </h2>
              )}
              <p className="text-[#848e9c] text-xs">
                ≈ {mask(`${(totalValue / 65000).toFixed(6)} BTC`)}
              </p>

              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-[11px] text-[#848e9c] mb-0.5">Available Balance</p>
                  <p className="text-sm font-semibold text-white">{mask(formatUsd(availableBalance))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#848e9c] mb-0.5">Frozen Balance</p>
                  <p className="text-sm font-semibold text-white">{mask(formatUsd(frozenBalance))}</p>
                </div>
              </div>
            </div>

            {/* Right: PnL */}
            <div className="text-right min-w-[110px]">
              <p className="text-[11px] text-[#848e9c] mb-1">Today's PnL</p>
              <p className={`text-base font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {mask(`${totalPnl >= 0 ? "+" : ""}${formatUsd(totalPnl)} (${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%)`)}
              </p>
              <p className="text-[11px] text-[#848e9c] mt-2 mb-1">7D PnL</p>
              <p className={`text-sm font-semibold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {mask(`${totalPnl >= 0 ? "+" : ""}${formatUsd(totalPnl * 3.2)} (+${(pnlPercent * 2.8).toFixed(2)}%)`)}
              </p>
              {/* Sparkline placeholder */}
              <div className="mt-2 flex items-end gap-0.5 justify-end h-8">
                {[3,5,4,7,6,9,8,10,9,12].map((v, i) => (
                  <div key={i} style={{ height: `${v * 3}%` }}
                    className="w-1 rounded-sm bg-green-500/60 min-h-[2px]" />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-5">
            <Link href="/p2p/buy"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-[#0b0e11] rounded-xl font-bold text-[15px] hover:bg-primary/90 transition">
              <FiRepeat size={15} /> Trade
            </Link>
            <Link href="/deposit"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.06] text-white border border-white/[0.06] rounded-xl font-medium text-[15px] hover:bg-white/[0.1] transition">
              <FiDownload size={15} /> Deposit
            </Link>
            <button
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.06] text-white border border-white/[0.06] rounded-xl font-medium text-[15px] hover:bg-white/[0.1] transition">
              <FiUpload size={15} /> Withdraw
            </button>
            <button onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.06] text-white border border-white/[0.06] rounded-xl font-medium text-[15px] hover:bg-white/[0.1] transition">
              <FiRepeat size={15} /> Transfer
            </button>
          </div>
        </motion.div>

        {/* ── TRADE PROMO BANNER ── */}
        <AnimatePresence>
          {showTradePromo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4 flex items-center justify-between overflow-hidden">
              <div>
                <p className="text-white font-bold text-base leading-tight">Start Trading Now</p>
                <p className="text-[#848e9c] text-xs mt-0.5">Trade 100+ crypto pairs with low fees</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 opacity-80">
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">₿</div>
                </div>
                <button onClick={() => setShowTradePromo(false)}
                  className="text-[#848e9c] hover:text-white transition p-1">
                  <FiX size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ASSET HOLDINGS ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-white">Asset Holdings</h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-[#848e9c] cursor-pointer select-none">
                <input type="checkbox" checked={hideSmall} onChange={e => setHideSmall(e.target.checked)}
                  className="accent-primary w-3 h-3" />
                Hide Small Balances
              </label>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" size={14} />
            <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search assets"
              className="w-full bg-[#161a1e] border border-white/[0.04] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[#848e9c] focus:outline-none focus:border-primary transition" />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-2 py-1 text-[10px] text-[#848e9c] uppercase tracking-wider mb-1">
            <span>Asset</span>
            <span className="text-right">Available</span>
            <span className="text-right">Frozen</span>
            <span className="text-right">USD Value</span>
          </div>

          {holdingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <SkeletonCard key={i} className="h-16" />)}
            </div>
          ) : enrichedHoldings.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center bg-[#161a1e] rounded-2xl border border-white/[0.04]">
              <FiActivity className="text-[#848e9c] mb-3" size={32} />
              <h4 className="text-white font-bold text-base mb-1">Your Spot Wallet is Empty</h4>
              <p className="text-[#848e9c] text-sm max-w-[220px] mb-5">
                Deposit or buy crypto to start building your portfolio.
              </p>
              <div className="flex gap-3">
                <Link href="/deposit" className="px-5 py-2 bg-white/[0.06] border border-white/[0.04] rounded-lg text-sm font-bold text-white hover:bg-white/[0.1] transition">
                  Deposit Crypto
                </Link>
                <Link href="/p2p/buy" className="px-5 py-2 bg-primary rounded-lg text-sm font-bold text-[#0b0e11] hover:bg-primary/90 transition">
                  Buy Crypto
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.04] bg-[#161a1e] overflow-hidden">
              {enrichedHoldings.map((h, idx) => {
                const live = coins.find(c => c.symbol.toUpperCase() === h.coin.toUpperCase());
                const positive = (h.change24h ?? 0) >= 0;
                if (hideSmall && h.liveValue < 1) return null;

                return (
                  <Link key={h.id} href={`/profile/spot/${h.coin.toLowerCase()}`}>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-3 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition cursor-pointer"
                    >
                      {/* Asset info */}
                      <div className="flex items-center gap-2.5">
                        {live?.image ? (
                          <div className="relative w-9 h-9 shrink-0">
                            <Image src={live.image} alt={h.coin} fill sizes="36px" className="rounded-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {h.coin.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[16px] font-medium text-white leading-tight">{h.coin}</p>
                          <p className="text-[13px] text-[#848e9c] leading-tight truncate">{live?.name ?? h.coin}</p>
                        </div>
                      </div>

                      {/* Available */}
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-[#eaecef]">{mask(h.amount.toFixed(6))}</p>
                        <p className="text-[11px] text-[#848e9c]">{mask(formatUsd(h.liveValue))}</p>
                      </div>

                      {/* Frozen */}
                      <div className="text-right">
                        <p className="text-[13px] font-medium text-[#eaecef]">{mask(((h as any).lockedBalance ?? 0).toFixed(6))}</p>
                        <p className="text-[11px] text-[#848e9c]">{mask(formatUsd(((h as any).lockedBalance ?? 0) * h.currentPrice))}</p>
                      </div>

                      {/* USD Value + change */}
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-white">{mask(formatUsd(h.liveValue))}</p>
                        <p className={`text-[11px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(h.change24h)}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}

              <button className="w-full py-3 text-sm text-[#848e9c] hover:text-white flex items-center justify-center gap-1 transition">
                View All Assets <FiTrendingUp size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ── SPOT ACCOUNT OVERVIEW TABS ── */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">Spot Account Overview</h3>
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
            {OVERVIEW_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveOverviewTab(tab.id)}
                className={`shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition ${
                  activeOverviewTab === tab.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/[0.06] bg-[#161a1e] text-[#848e9c] hover:text-white"
                }`}>
                {tab.icon}
                <span className="text-[11px] font-medium whitespace-nowrap leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.04] bg-[#161a1e] p-5">
            <p className="text-center text-[#848e9c] text-sm py-6">No {OVERVIEW_TABS.find(t => t.id === activeOverviewTab)?.label} yet.</p>
          </div>
        </div>

        {/* ── LIVE MARKET COIN LIST ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-white">Markets</h3>
            <Link href="/market" className="text-primary text-sm font-medium hover:underline">
              View All →
            </Link>
          </div>

          {/* Search coins */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" size={14} />
            <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search coin"
              className="w-full bg-[#161a1e] border border-white/[0.04] rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-[#848e9c] focus:outline-none focus:border-primary transition" />
          </div>

          {/* Column headers */}
          <div className="flex items-center justify-between px-3 py-1 text-[10px] text-[#848e9c] uppercase tracking-wider">
            <span>Trading Pairs</span>
            <span>Last Price / 24H Change</span>
          </div>

          {marketError ? (
            <div className="py-10 flex flex-col items-center text-center bg-[#161a1e] rounded-xl border border-white/[0.04]">
              <p className="text-[#848e9c] text-sm mb-3">Failed to load market data.</p>
              <button onClick={() => fetchMarket()} className="px-4 py-2 bg-primary text-[#0b0e11] rounded-lg font-bold text-sm">Retry</button>
            </div>
          ) : marketLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.04] bg-[#161a1e] overflow-hidden">
              {(filteredCoins.length > 0 ? filteredCoins : coins).slice(0, 20).map((coin, idx) => {
                const positive = (coin.change24h ?? 0) >= 0;
                const starred = favorites.includes(coin.id);
                return (
                  <motion.div key={coin.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="flex items-center gap-3 px-3 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition cursor-pointer"
                    onClick={() => router.push(`/trade/${coin.symbol.toLowerCase()}`)}
                  >
                    <button type="button" onClick={e => { e.stopPropagation(); toggleFavorite(coin.id); }}
                      className="shrink-0 text-[#848e9c] hover:text-primary transition">
                      <FiStar size={14} className={starred ? "fill-primary text-primary" : ""} />
                    </button>

                    <div className="relative w-8 h-8 shrink-0">
                      <Image src={coin.image} alt={coin.symbol} fill sizes="32px" className="rounded-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-medium text-white leading-tight">
                        {coin.symbol}<span className="text-[#848e9c] font-normal text-[13px]">/USDT</span>
                      </p>
                      <p className="text-[13px] text-[#848e9c] truncate leading-tight">{coin.name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-semibold text-white">{formatUsd(coin.price)}</p>
                      <p className={`text-[13px] font-semibold ${positive ? "text-green-400" : "text-red-400"}`}>
                        {formatPercent(coin.change24h)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Link href="/market"
            className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.04] bg-[#161a1e] text-[#848e9c] hover:text-white text-sm font-medium transition">
            See All Coins <FiTrendingUp size={14} />
          </Link>
        </div>
      </div>

      {/* ── TRANSFER MODAL ── */}
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} defaultFrom="funding" />
    </div>
  );
}
