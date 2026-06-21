"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceTicker } from "@/hooks/useBinanceMarket";
import type { OrderType } from "@/lib/binance/types";
import { formatUsd } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

const FEE_RATE = 0.001;

export function BuySellPanel() {
  const router = useRouter();
  const { kycStatus } = useAuth();
  const { pair, balances, placeOrder } = useTrade();
  const { data: ticker } = useBinanceTicker(pair.symbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [verifyPrompt, setVerifyPrompt] = useState(false);

  const verified = kycStatus === "verified";
  const lastPrice = parseFloat(ticker?.lastPrice ?? "0");
  const effectivePrice = orderType === "market" ? lastPrice : parseFloat(price || "0");
  const amountNum = parseFloat(amount || "0");
  const total = effectivePrice * amountNum;
  const fee = total * FEE_RATE;

  const availableUsdt = balances.USDT ?? 0;
  const availableBase = balances[pair.base] ?? 0;

  useEffect(() => {
    if (orderType === "limit" && ticker?.lastPrice) {
      setPrice(ticker.lastPrice);
    }
  }, [pair.symbol, orderType, ticker?.lastPrice]);

  const promptVerify = () => {
    setVerifyPrompt(true);
    window.setTimeout(() => setVerifyPrompt(false), 4000);
  };

  const handleSubmit = () => {
    if (!verified) {
      promptVerify();
      return;
    }

    if (!effectivePrice || !amountNum) return;

    placeOrder({
      side,
      type: orderType,
      price: effectivePrice,
      amount: amountNum,
    });
    setAmount("");
  };

  return (
    <div className={`${appTheme.card} space-y-3`}>
      {!verified && (
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5">
          <p className="text-xs font-medium text-white">
            Complete KYC verification to enable buy & sell.
          </p>
          <Link href="/kyc?start=1" className="mt-1 inline-block text-xs font-semibold text-primary">
            Verify now →
          </Link>
        </div>
      )}

      {verifyPrompt && (
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-3 py-2.5 text-center">
          <p className="text-xs font-medium text-white">Verify your account to place orders.</p>
          <button
            type="button"
            onClick={() => router.push("/kyc?start=1")}
            className="mt-2 text-xs font-semibold text-primary"
          >
            Go to verification →
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#0b0e11] p-1">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={`rounded-lg py-2 text-xs font-semibold transition ${
            side === "buy" ? "bg-secondary text-white" : "text-[#848e9c]"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={`rounded-lg py-2 text-xs font-semibold transition ${
            side === "sell" ? "bg-red-500 text-white" : "text-[#848e9c]"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-2">
        {(["market", "limit"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setOrderType(type)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-medium capitalize ${
              orderType === type ? "bg-primary/15 text-primary" : "text-[#848e9c]"
            }`}
          >
            {type} Order
          </button>
        ))}
      </div>

      <div className={`space-y-2.5 ${!verified ? "pointer-events-none opacity-60" : ""}`}>
        {orderType === "limit" && (
          <label className="block">
            <span className="mb-1 block text-[10px] text-[#848e9c]">Price ({pair.quote})</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={appTheme.input}
              placeholder="0.00"
              inputMode="decimal"
              disabled={!verified}
              readOnly={!verified}
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-[10px] text-[#848e9c]">Amount ({pair.base})</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={appTheme.input}
            placeholder="0.00"
            inputMode="decimal"
            disabled={!verified}
            readOnly={!verified}
          />
        </label>

        <div className="rounded-xl bg-[#0b0e11] px-3 py-2 text-[11px]">
          <div className="flex justify-between text-[#848e9c]">
            <span>Total</span>
            <span className="text-white">{formatUsd(total || 0)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[#848e9c]">
            <span>Est. fee (0.1%)</span>
            <span className="text-white">{formatUsd(fee || 0)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[#848e9c]">
            <span>Available</span>
            <span className="text-white">
              {side === "buy"
                ? `${formatUsd(availableUsdt)} USDT`
                : `${availableBase.toFixed(6)} ${pair.base}`}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={verified && (!amountNum || !effectivePrice)}
        className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
          verified
            ? side === "buy"
              ? "bg-secondary hover:bg-secondary/90"
              : "bg-red-500 hover:bg-red-600"
            : "bg-primary hover:bg-primary/90"
        }`}
      >
        {verified
          ? side === "buy"
            ? `Buy ${pair.base}`
            : `Sell ${pair.base}`
          : "Verify to enable trading"}
      </button>
    </div>
  );
}
