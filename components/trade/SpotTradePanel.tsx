"use client";

import { useState, useEffect } from "react";
import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceTicker } from "@/hooks/useBinanceMarket";
import { executeSpotTrade } from "@/lib/trade/trade-service";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeSpotHoldings, SpotHolding } from "@/lib/profile/wallet-service";
import { appTheme } from "@/components/layout/app-theme";
import { FiClock } from "react-icons/fi";
import { useRouter } from "next/navigation";

export function SpotTradePanel() {
  const { pair } = useTrade();
  const { user } = useAuth();
  const router = useRouter();
  const { data: ticker } = useBinanceTicker(pair.symbol);

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("market");
  
  const [priceInput, setPriceInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  
  const [holdings, setHoldings] = useState<SpotHolding[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribeSpotHoldings(user.uid, setHoldings);
      return () => unsub();
    }
  }, [user]);

  // Auto-update market price if in market mode
  useEffect(() => {
    if (orderType === "market" && ticker) {
      setPriceInput(ticker.lastPrice);
    }
  }, [orderType, ticker, pair.symbol]);

  // Reset inputs on pair change
  useEffect(() => {
    setAmountInput("");
    if (ticker) {
      setPriceInput(ticker.lastPrice);
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

  const handleTrade = async () => {
    if (!user?.uid) {
      router.push("/sign-in");
      return;
    }
    if (currentAmount <= 0 || currentPrice <= 0) return;
    
    // In market mode, we always execute immediately at the displayed market price
    // Limit orders are not fully supported without a matching engine, so we just execute them immediately too for this MVP.
    
    setIsSubmitting(true);
    try {
      const res = await executeSpotTrade(
        user.uid,
        baseCoin,
        quoteCoin,
        activeTab,
        currentAmount,
        currentPrice
      );
      
      if (res.success) {
        setAmountInput("");
        // Success feedback could be added here
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Trade failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${appTheme.card} p-0`}>
      {/* Header Tabs */}
      <div className="flex border-b border-white/[0.06]">
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
          <div className="flex h-10 w-full items-center justify-between rounded-lg bg-[#0b0e11] px-3 border border-white/[0.06] focus-within:border-primary/50 transition">
            <span className="text-xs text-[#848e9c]">Price</span>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              disabled={orderType === "market"}
              className="w-full bg-transparent text-right text-sm font-medium text-white outline-none disabled:text-[#848e9c]"
              placeholder="0.00"
            />
            <span className="ml-2 text-xs font-medium text-white">{quoteCoin}</span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1">
          <div className="flex h-10 w-full items-center justify-between rounded-lg bg-[#0b0e11] px-3 border border-white/[0.06] focus-within:border-primary/50 transition">
            <span className="text-xs text-[#848e9c]">Amount</span>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-transparent text-right text-sm font-medium text-white outline-none"
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
              className="flex-1 rounded border border-white/[0.06] bg-[#0b0e11] py-1 text-[10px] font-medium text-[#848e9c] hover:border-[#848e9c] hover:text-white transition"
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

        {/* Submit Button */}
        <button
          onClick={handleTrade}
          disabled={isSubmitting || currentAmount <= 0 || currentPrice <= 0 || (activeTab === "buy" ? totalQuote > quoteBalance : currentAmount > baseBalance)}
          className={`w-full rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "buy" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isSubmitting ? "Processing..." : `${activeTab === "buy" ? "Buy" : "Sell"} ${baseCoin}`}
        </button>
      </div>
    </div>
  );
}
