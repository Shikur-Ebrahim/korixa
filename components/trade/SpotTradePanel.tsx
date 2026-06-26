"use client";

import { useState, useEffect } from "react";
import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceTicker } from "@/hooks/useBinanceMarket";
import { executeSpotTrade } from "@/lib/trade/trade-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { appTheme } from "@/components/layout/app-theme";
import { FiClock, FiLock, FiShield } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTradingSettings } from "@/hooks/useTradingSettings";

export function SpotTradePanel() {
  const { pair } = useTrade();
  const { user, kycStatus, kycLoading } = useAuth();
  const router = useRouter();
  const { data: ticker } = useBinanceTicker(pair.symbol);
  const { settings: tradeSettings } = useTradingSettings();

  const isKycVerified = kycStatus === "verified";

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">(tradeSettings.defaultOrderType ?? "market");

  // Sync orderType with settings change (only if user hasn't manually changed it)
  useEffect(() => {
    setOrderType(tradeSettings.defaultOrderType ?? "market");
  }, [tradeSettings.defaultOrderType]);
  
  const [priceInput, setPriceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  
  const [holdings, setHoldings] = useState<SpotHolding[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeSpotHoldings(user.uid, setHoldings);
      return () => unsub();
    }
  }, [user]);

  useEffect(() => {
    if (orderType === "market" && ticker) {
      setPriceInput(parseFloat(ticker.lastPrice).toString());
    }
  }, [orderType, ticker, pair.symbol]);

  // Reset inputs on pair change
  useEffect(() => {
    setAmountInput("");
    if (ticker) {
      setPriceInput(parseFloat(ticker.lastPrice).toString());
    }
  }, [pair.symbol]);

  const baseCoin = pair.base;
  const quoteCoin = pair.quote;

  const baseBalance = holdings.find(h => h.coin === baseCoin)?.amount || 0;
  const quoteBalance = holdings.find(h => h.coin === quoteCoin)?.amount || 0;

  const currentPrice = parseFloat(priceInput || "0");
  const currentAmount = parseFloat(amountInput || "0");
  const totalQuote = currentPrice * currentAmount;

  const availableBalance = activeTab === "buy" ? quoteBalance : baseBalance;
  const availableAsset = activeTab === "buy" ? quoteCoin : baseCoin;

  const handlePercentageClick = (pct: number) => {
    if (!currentPrice) return;
    
    if (activeTab === "buy") {
      // Buying: pct of quote balance
      const maxQuote = quoteBalance * (pct / 100);
      const amount = maxQuote / currentPrice;
      setAmountInput(amount ? amount.toFixed(6) : "");
    } else {
      // Selling: pct of base balance
      const amount = baseBalance * (pct / 100);
      setAmountInput(amount ? amount.toFixed(6) : "");
    }
  };

  const [notification, setNotification] = useState<{type: "success" | "error", message: string} | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTrade = async () => {
    if (!user?.uid) { router.push("/sign-in"); return; }
    if (!isKycVerified) return;
    if (currentAmount <= 0 || currentPrice <= 0) return;

    // Order Confirmation (from Trading Settings)
    if (tradeSettings.requireOrderConfirmation) {
      setConfirmModal(true);
      return;
    }
    await executeTrade();
  };

  const executeTrade = async () => {
    setConfirmModal(false);
    setIsSubmitting(true);
    setNotification(null);
    try {
      const res = await executeSpotTrade(
        user!.uid, baseCoin, quoteCoin, activeTab, currentAmount, currentPrice
      );
      if (res.success) {
        setAmountInput("");
        showToast("success", `Successfully ${activeTab === "buy" ? "bought" : "sold"} ${currentAmount} ${baseCoin}!`);
      } else {
        showToast("error", res.message || "Trade failed");
      }
    } catch (err: any) {
      showToast("error", err.message || "Trade failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${appTheme.card} p-0`}>
      {/* Header Tabs */}
      <div className="flex border-b border-white/[0.06] relative">
        <button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "buy" ? "bg-green-500/10 text-green-500" : "text-[#848e9c] hover:bg-white/[0.02]"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab("sell")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "sell" ? "bg-red-500/10 text-red-500" : "text-[#848e9c] hover:bg-white/[0.02]"
          }`}
        >
          Sell
        </button>
        <Link 
          href="/trade/orders" 
          className="absolute right-0 top-0 bottom-0 px-4 flex items-center justify-center text-[#848e9c] hover:text-white transition"
          title="Orders & History"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Type */}
        <div className="flex gap-4 border-b border-white/[0.06] pb-2">
          <button
            onClick={() => setOrderType("limit")}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors ${
              orderType === "limit" ? "border-primary text-white" : "border-transparent text-[#848e9c] hover:text-white"
            }`}
          >
            Limit
          </button>
          <button
            onClick={() => setOrderType("market")}
            className={`text-xs font-semibold pb-2 border-b-2 transition-colors ${
              orderType === "market" ? "border-primary text-white" : "border-transparent text-[#848e9c] hover:text-white"
            }`}
          >
            Market
          </button>
        </div>

        {/* Price Input */}
        <div className="space-y-1">
          <div className={`flex h-10 w-full items-center justify-between rounded-lg bg-[#0b0e11] px-3 border border-white/[0.06] focus-within:border-primary/50 transition ${!isKycVerified ? "opacity-50" : ""}`}>
            <span className="text-xs text-[#848e9c]">Price</span>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              disabled={orderType === "market" || !isKycVerified}
              className="w-full bg-transparent text-right text-sm font-medium text-white outline-none disabled:text-[#848e9c]"
              placeholder="0.00"
            />
            <span className="ml-2 text-xs font-medium text-white">{quoteCoin}</span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <div className={`flex h-10 w-full items-center justify-between rounded-lg bg-[#0b0e11] px-3 border border-white/[0.06] focus-within:border-primary/50 transition ${!isKycVerified ? "opacity-50" : ""}`}>
            <span className="text-xs text-[#848e9c]">Amount</span>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={!isKycVerified}
              className="w-full bg-transparent text-right text-sm font-medium text-white outline-none disabled:text-[#848e9c]"
              placeholder="0.00"
            />
            <span className="ml-2 text-xs font-medium text-white">{baseCoin}</span>
          </div>
        </div>

        {/* Percentages */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => handlePercentageClick(pct)}
              disabled={!isKycVerified}
              className="flex-1 rounded border border-white/[0.06] bg-[#0b0e11] py-1 text-[10px] font-medium text-[#848e9c] hover:border-[#848e9c] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/[0.06] disabled:hover:text-[#848e9c]"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Total Estimate */}
        <div className="flex items-center justify-between py-2 text-xs">
          <span className="text-[#848e9c]">Total</span>
          <span className="font-medium text-white">
            {totalQuote > 0 ? totalQuote.toFixed(2) : "--"} {quoteCoin}
          </span>
        </div>

        {/* Available Balance */}
        <div className="flex items-center justify-between text-[11px] border-t border-white/[0.06] pt-3">
          <span className="text-[#848e9c]">Available</span>
          <span className="font-semibold text-white">
            {availableBalance.toFixed(availableAsset === "USDT" ? 2 : 6)} {availableAsset}
          </span>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`px-4 py-3 rounded-xl border text-xs font-semibold text-center animate-in fade-in slide-in-from-bottom-2 ${
            notification.type === "success" 
              ? "bg-green-500/10 text-green-500 border-green-500/20" 
              : "bg-red-500/10 text-red-500 border-red-500/20"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Submit Button or KYC Lock */}
        {!isKycVerified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <FiLock className="text-yellow-500 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-yellow-500">Trading Locked</p>
                <p className="text-[10px] text-[#848e9c] mt-0.5">
                  {kycStatus === "rejected"
                    ? "Your verification was rejected. Please resubmit to unlock trading."
                    : "Not Verified. Please complete the KYC verification step to start trading."}
                </p>
              </div>
            </div>
            <Link
              href="/kyc?start=1"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90"
            >
              <FiShield size={16} />
              {kycStatus === "pending" ? "Check Verification Status" : kycStatus === "rejected" ? "Resubmit Verification" : "Complete KYC to Trade"}
            </Link>
          </div>
        ) : (
          <button
            onClick={handleTrade}
            disabled={isSubmitting || currentAmount <= 0 || currentPrice <= 0 || (activeTab === "buy" ? totalQuote > quoteBalance : currentAmount > baseBalance)}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
              activeTab === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isSubmitting ? "Processing..." : `${activeTab === "buy" ? "Buy" : "Sell"} ${baseCoin}`}
          </button>
        )}
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setConfirmModal(false)}>
          <div
            className="w-full max-w-sm rounded-t-3xl border-t border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${
                activeTab === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}>
                {activeTab === "buy" ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-base font-bold text-white">
                Confirm {activeTab === "buy" ? "Buy" : "Sell"} Order
              </h3>
              <p className="text-[11px] text-[#848e9c] mt-1">Review your order before placing</p>
            </div>

            {/* Order details */}
            <div className="rounded-2xl bg-[#161a1e] border border-white/[0.06] divide-y divide-white/[0.05]">
              <div className="flex justify-between px-4 py-3">
                <span className="text-xs text-[#848e9c]">Action</span>
                <span className={`text-xs font-bold ${activeTab === "buy" ? "text-green-400" : "text-red-400"}`}>
                  {activeTab === "buy" ? "BUY" : "SELL"} {baseCoin}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-xs text-[#848e9c]">Amount</span>
                <span className="text-xs font-semibold text-white">{currentAmount.toFixed(6)} {baseCoin}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-xs text-[#848e9c]">Price</span>
                <span className="text-xs font-semibold text-white">{currentPrice.toLocaleString()} {quoteCoin}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-xs text-[#848e9c]">Total</span>
                <span className="text-xs font-bold text-white">{totalQuote.toFixed(2)} {quoteCoin}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 rounded-2xl bg-white/[0.06] py-4 text-sm font-bold text-white hover:bg-white/[0.1] active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeTrade}
                className={`flex-1 rounded-2xl py-4 text-sm font-bold text-white active:scale-95 transition ${
                  activeTab === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {activeTab === "buy" ? "Confirm Buy" : "Confirm Sell"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


