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

type OverviewTab = "open_orders" | "order_history" | "trade_history" | "tx_history" | "analysis";

const OVERVIEW_TABS: { id: OverviewTab; label: string; icon: React.ReactNode }[] = [
  { id: "open_orders",   label: "Open Orders",        icon: <FiList      size={16} /> },
  { id: "order_history", label: "Order History",      icon: <FiClock     size={16} /> },
  { id: "trade_history", label: "Trade History",      icon: <FiActivity  size={16} /> },
  { id: "tx_history",    label: "Transaction History",icon: <FiRepeat    size={16} /> },
  { id: "analysis",      label: "Asset Analysis",     icon: <FiBarChart2 size={16} /> },
];

const FAV_KEY = "korixa-spot-fav";
function loadFav(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]"); } catch { return []; }
}
function saveFav(ids: string[]) { localStorage.setItem(FAV_KEY, JSON.stringify(ids)); }

function Skeleton({ cls = "" }: { cls?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${cls}`} />;
}

export default function SpotAccountPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [holdings,       setHoldings]       = useState<SpotHolding[]>([]);
  const [holdLoading,    setHoldLoading]     = useState(true);
  const [coins,          setCoins]           = useState<MarketCoin[]>([]);
  const [mktLoading,     setMktLoading]      = useState(true);
  const [mktError,       setMktError]        = useState(false);
  const [hideBalance,    setHideBalance]     = useState(false);
  const [transferOpen,   setTransferOpen]    = useState(false);
  const [refreshing,     setRefreshing]      = useState(false);
  const [search,         setSearch]          = useState("");
  const [hideSmall,      setHideSmall]       = useState(false);
  const [activeTab,      setActiveTab]       = useState<OverviewTab>("open_orders");
  const [favs,           setFavs]            = useState<string[]>([]);
  const [promo,          setPromo]           = useState(true);

  const fetchMkt = async (silent = false) => {
    if (!silent) setMktLoading(true);
    setMktError(false);
    try {
      const r = await fetch("/api/market", { cache: "no-store" });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setCoins(d.coins ?? []);
    } catch { setMktError(true); }
    finally   { setMktLoading(false); }
  };

  useEffect(() => {
    if (!user?.uid) return;
    setHoldLoading(true);
    const unsub = subscribeSpotHoldings(user.uid, (d) => { setHoldings(d); setHoldLoading(false); });
    return () => unsub();
  }, [user]);

  useEffect(() => { fetchMkt(); setFavs(loadFav()); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMkt(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const enriched = useMemo(() =>
    holdings.map(h => {
      const live = coins.find(c => c.symbol.toUpperCase() === h.coin.toUpperCase());
      const price = live?.price ?? h.currentPrice ?? 0;
      return { ...h, currentPrice: price, change24h: live?.change24h ?? 0, liveValue: h.amount * price };
    }), [holdings, coins]);

  const totalValue   = enriched.reduce((s, h) => s + h.liveValue, 0);
  const totalPnl     = enriched.reduce((s, h) => s + h.unrealizedPnl, 0);
  const frozen       = enriched.reduce((s, h) => s + ((h as any).lockedBalance ?? 0) * h.currentPrice, 0);
  const available    = totalValue - frozen;
  const pnlPct       = totalValue > 0 ? (totalPnl / Math.max(1, totalValue - totalPnl)) * 100 : 0;

  const filteredCoins = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)) : coins;
  }, [coins, search]);

  const toggleFav = (id: string) => setFavs(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    saveFav(next); return next;
  });

  const $ = (s: string) => hideBalance ? "••••" : s;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-24">

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md border-b border-white/[0.05] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1 rounded-full hover:bg-white/[0.07] transition active:scale-95">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-white">Spot Account</h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleRefresh}
            className={`p-2 rounded-full text-[#848e9c] hover:text-white transition ${refreshing ? "animate-spin" : ""}`}>
            <FiRefreshCw size={16} />
          </button>
          <button className="p-2 rounded-full text-[#848e9c] hover:text-white transition">
            <FiList size={16} />
          </button>
          <button className="p-2 rounded-full text-[#848e9c] hover:text-white transition">
            <FiClock size={16} />
          </button>
        </div>
      </div>

      <div className="px-3 pt-4 space-y-3">

        {/* BALANCE CARD */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#161a1e] p-4">
          {/* Top row: label + sparkline */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#848e9c] font-medium">Total Spot Balance</span>
              <button onClick={() => setHideBalance(v => !v)} className="text-[#848e9c]">
                {hideBalance ? <FiEyeOff size={12} /> : <FiEye size={12} />}
              </button>
            </div>
            {/* Mini sparkline */}
            <div className="flex items-end gap-[2px] h-6">
              {[3, 5, 4, 7, 5, 9, 7, 10, 8, 12].map((v, i) => (
                <div key={i} style={{ height: `${v * 8}%` }}
                  className="w-[3px] rounded-sm bg-green-500/70 min-h-[2px]" />
              ))}
            </div>
          </div>

          {/* Main balance */}
          {holdLoading ? <Skeleton cls="h-7 w-32 mb-1" /> : (
            <p className="text-[20px] font-bold text-white leading-tight mb-0.5">
              {$(formatUsd(totalValue))}
            </p>
          )}
          <p className="text-[10px] text-[#848e9c] mb-3">≈ {$(`${(totalValue / 65000).toFixed(6)} BTC`)}</p>

          {/* PnL + balances 2x2 grid */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 pb-3 border-b border-white/[0.05] mb-3">
            <div>
              <p className="text-[10px] text-[#848e9c]">Today&apos;s PnL</p>
              <p className={`text-[12px] font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {$(`${totalPnl >= 0 ? "+" : ""}${formatUsd(totalPnl)}`)}
              </p>
              <p className={`text-[10px] ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {$(`(${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)`)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#848e9c]">7D PnL</p>
              <p className={`text-[12px] font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {$(`${totalPnl >= 0 ? "+" : ""}${formatUsd(totalPnl * 3.2)}`)}
              </p>
              <p className={`text-[10px] ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                {$(`(+${(pnlPct * 2.8).toFixed(2)}%)`)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#848e9c]">Available Balance</p>
              <p className="text-[12px] font-semibold text-white">{$(formatUsd(available))}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#848e9c]">Frozen Balance</p>
              <p className="text-[12px] font-semibold text-white">{$(formatUsd(frozen))}</p>
            </div>
          </div>

          {/* Action buttons — 4 equal columns, icon + label */}
          <div className="grid grid-cols-4 gap-2">
            <Link href="/p2p/buy"
              className="flex flex-col items-center gap-1 py-2.5 px-1 bg-primary text-[#0b0e11] rounded-xl active:scale-95 transition">
              <FiRepeat size={13} />
              <span className="text-[10px] font-bold leading-none">Trade</span>
            </Link>
            <Link href="/deposit"
              className="flex flex-col items-center gap-1 py-2.5 px-1 bg-white/[0.06] text-white border border-white/[0.07] rounded-xl active:scale-95 transition">
              <FiDownload size={13} />
              <span className="text-[10px] font-medium leading-none">Deposit</span>
            </Link>
            <button
              className="flex flex-col items-center gap-1 py-2.5 px-1 bg-white/[0.06] text-white border border-white/[0.07] rounded-xl active:scale-95 transition">
              <FiUpload size={13} />
              <span className="text-[10px] font-medium leading-none">Withdraw</span>
            </button>
            <button onClick={() => setTransferOpen(true)}
              className="flex flex-col items-center gap-1 py-2.5 px-1 bg-white/[0.06] text-white border border-white/[0.07] rounded-xl active:scale-95 transition">
              <FiRepeat size={13} />
              <span className="text-[10px] font-medium leading-none">Transfer</span>
            </button>
          </div>
        </div>

        {/* PROMO BANNER */}
        <AnimatePresence>
          {promo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Start Trading Now</p>
                  <p className="text-[#848e9c] text-[11px] mt-0.5">Trade 100+ pairs with low fees</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">₿</span>
                  <button onClick={() => setPromo(false)} className="text-[#848e9c] hover:text-white p-1">
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ASSET HOLDINGS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Asset Holdings</h3>
            <label className="flex items-center gap-1 text-[10px] text-[#848e9c] cursor-pointer">
              <input type="checkbox" checked={hideSmall} onChange={e => setHideSmall(e.target.checked)}
                className="accent-primary w-3 h-3" />
              Hide Small Balances
            </label>
          </div>

          <div className="relative mb-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" size={12} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search assets"
              className="w-full bg-[#161a1e] border border-white/[0.05] rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder:text-[#848e9c] focus:outline-none focus:border-primary/50 transition" />
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr] px-2 mb-1 text-[9px] text-[#848e9c] uppercase tracking-wide">
            <span>Asset</span>
            <span className="text-right">Available</span>
            <span className="text-right">Frozen</span>
            <span className="text-right">USD Value</span>
          </div>

          {holdLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} cls="h-14" />)}
            </div>
          ) : enriched.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center bg-[#161a1e] rounded-2xl border border-white/[0.05]">
              <FiActivity className="text-[#848e9c] mb-2" size={24} />
              <p className="text-white font-bold text-sm mb-1">Your Spot Wallet is Empty</p>
              <p className="text-[#848e9c] text-[11px] max-w-[200px] mb-4">Deposit or buy crypto to start building your portfolio.</p>
              <div className="flex gap-2">
                <Link href="/deposit" className="px-4 py-2 bg-white/[0.06] border border-white/[0.05] rounded-lg text-[11px] font-bold text-white">Deposit</Link>
                <Link href="/p2p/buy" className="px-4 py-2 bg-primary rounded-lg text-[11px] font-bold text-[#0b0e11]">Buy Crypto</Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.05] bg-[#161a1e] overflow-hidden">
              {enriched.map((h, idx) => {
                const live = coins.find(c => c.symbol.toUpperCase() === h.coin.toUpperCase());
                const pos = (h.change24h ?? 0) >= 0;
                if (hideSmall && h.liveValue < 1) return null;
                return (
                  <Link key={h.id} href={`/profile/spot/${h.coin.toLowerCase()}`}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr] items-center px-2 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] active:bg-white/[0.04] transition">
                      {/* Coin */}
                      <div className="flex items-center gap-2">
                        {live?.image ? (
                          <div className="relative w-7 h-7 shrink-0">
                            <Image src={live.image} alt={h.coin} fill sizes="28px" className="rounded-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {h.coin.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white leading-tight">{h.coin}</p>
                          <p className="text-[9px] text-[#848e9c] leading-tight truncate">{live?.name ?? h.coin}</p>
                        </div>
                      </div>
                      {/* Available */}
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-[#eaecef] leading-tight">{$(h.amount.toFixed(4))}</p>
                        <p className="text-[9px] text-[#848e9c] leading-tight">{$(formatUsd(h.liveValue))}</p>
                      </div>
                      {/* Frozen */}
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-[#eaecef] leading-tight">{$(((h as any).lockedBalance ?? 0).toFixed(4))}</p>
                        <p className="text-[9px] text-[#848e9c] leading-tight">{$(formatUsd(((h as any).lockedBalance ?? 0) * h.currentPrice))}</p>
                      </div>
                      {/* USD + change */}
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-white leading-tight">{$(formatUsd(h.liveValue))}</p>
                        <p className={`text-[9px] font-semibold leading-tight ${pos ? "text-green-400" : "text-red-400"}`}>
                          {formatPercent(h.change24h)}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
              <button className="w-full py-2.5 text-[11px] text-[#848e9c] hover:text-white flex items-center justify-center gap-1 transition">
                View All Assets <FiTrendingUp size={11} />
              </button>
            </div>
          )}
        </div>

        {/* OVERVIEW TABS */}
        <div>
          <h3 className="text-sm font-bold text-white mb-2">Spot Account Overview</h3>
          <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1 -mx-1 px-1">
            {OVERVIEW_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border text-center transition ${
                  activeTab === tab.id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-white/[0.06] bg-[#161a1e] text-[#848e9c]"
                }`}>
                {tab.icon}
                <span className="text-[10px] font-medium whitespace-nowrap leading-none">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-xl border border-white/[0.05] bg-[#161a1e] px-4 py-6 text-center text-[11px] text-[#848e9c]">
            No {OVERVIEW_TABS.find(t => t.id === activeTab)?.label} yet.
          </div>
        </div>

        {/* LIVE MARKETS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Markets</h3>
            <Link href="/market" className="text-primary text-[11px] font-medium">View All →</Link>
          </div>

          <div className="relative mb-2">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" size={12} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search coin"
              className="w-full bg-[#161a1e] border border-white/[0.05] rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder:text-[#848e9c] focus:outline-none focus:border-primary/50 transition" />
          </div>

          <div className="flex items-center justify-between px-2 mb-1 text-[9px] text-[#848e9c] uppercase tracking-wide">
            <span>Trading Pairs</span>
            <span>Price / 24H Change</span>
          </div>

          {mktError ? (
            <div className="py-8 flex flex-col items-center bg-[#161a1e] rounded-xl border border-white/[0.05]">
              <p className="text-[#848e9c] text-xs mb-3">Failed to load market data.</p>
              <button onClick={() => fetchMkt()} className="px-4 py-2 bg-primary text-[#0b0e11] rounded-lg font-bold text-xs">Retry</button>
            </div>
          ) : mktLoading ? (
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} cls="h-12" />)}
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.05] bg-[#161a1e] overflow-hidden">
              {(filteredCoins.length > 0 ? filteredCoins : coins).slice(0, 20).map((coin, idx) => {
                const pos = (coin.change24h ?? 0) >= 0;
                const starred = favs.includes(coin.id);
                return (
                  <div key={coin.id}
                    className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] active:bg-white/[0.04] transition cursor-pointer"
                    onClick={() => router.push(`/trade/${coin.symbol.toLowerCase()}`)}>
                    <button type="button" onClick={e => { e.stopPropagation(); toggleFav(coin.id); }}
                      className="shrink-0 text-[#848e9c] hover:text-primary transition">
                      <FiStar size={12} className={starred ? "fill-primary text-primary" : ""} />
                    </button>
                    <div className="relative w-7 h-7 shrink-0">
                      <Image src={coin.image} alt={coin.symbol} fill sizes="28px" className="rounded-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white leading-tight">
                        {coin.symbol}<span className="text-[#848e9c] font-normal text-[10px]">/USDT</span>
                      </p>
                      <p className="text-[10px] text-[#848e9c] truncate leading-tight">{coin.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-semibold text-white leading-tight">{formatUsd(coin.price)}</p>
                      <p className={`text-[10px] font-semibold leading-tight ${pos ? "text-green-400" : "text-red-400"}`}>
                        {formatPercent(coin.change24h)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Link href="/market"
            className="mt-2 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-white/[0.05] bg-[#161a1e] text-[#848e9c] hover:text-white text-xs font-medium transition">
            See All Coins <FiTrendingUp size={12} />
          </Link>
        </div>
      </div>

      <TransferModal isOpen={transferOpen} onClose={() => setTransferOpen(false)} defaultFrom="funding" />
    </div>
  );
}
