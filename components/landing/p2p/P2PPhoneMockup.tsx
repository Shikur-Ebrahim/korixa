"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type Tab = "buy" | "sell";

const offers = [
  { user: "Trader_A", rate: "1.00", method: "Bank Transfer", amount: "$500" },
  { user: "CryptoPro", rate: "0.99", method: "Mobile Pay", amount: "$1,200" },
];

export function P2PPhoneMockup() {
  const [tab, setTab] = useState<Tab>("buy");

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px]">
      <motion.div
        className="relative rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-950 p-2 shadow-[0_25px_60px_rgba(59,130,246,0.2)]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="absolute left-1/2 top-3 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-black" />

        <div className="overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0B0F19]">
          <div className="border-b border-border px-4 pb-3 pt-8">
            <p className="text-center text-xs font-semibold text-foreground">P2P Marketplace</p>
          </div>

          <div className="flex gap-1 p-3">
            {(["buy", "sell"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize transition-all ${
                  tab === t
                    ? t === "buy"
                      ? "bg-secondary/20 text-secondary"
                      : "bg-blue-500/20 text-blue-400"
                    : "text-muted hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2 px-3 pb-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
              User Offers
            </p>
            {offers.map((offer) => (
              <div
                key={offer.user}
                className="rounded-xl border border-border bg-card/80 p-2.5 backdrop-blur-sm"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium">{offer.user}</span>
                  <span className="text-[10px] text-secondary">{offer.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Rate: {offer.rate} USD</span>
                  <span>{offer.method}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-3 mb-3 space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted">Exchange Rate</span>
              <span className="font-medium text-blue-400">1 USD = 1.00 USDT</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted">Payment Method</span>
              <span className="font-medium">Bank Transfer</span>
            </div>
          </div>

          <div className="px-3 pb-4">
            <button
              type="button"
              className={`w-full rounded-xl py-2.5 text-xs font-semibold transition-all ${
                tab === "buy"
                  ? "bg-secondary text-background shadow-[0_4px_14px_rgba(34,197,94,0.3)]"
                  : "bg-blue-500 text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)]"
              }`}
            >
              {tab === "buy" ? "Buy USD" : "Sell USD"}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-secondary/10 blur-3xl" />
    </div>
  );
}
