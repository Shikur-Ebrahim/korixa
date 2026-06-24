"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SpotTradePanel } from "@/components/trade/SpotTradePanel";
import { MarketOverviewStrip } from "@/components/trade/MarketOverviewStrip";
import { OrderBook } from "@/components/trade/OrderBook";
import { RecentTrades } from "@/components/trade/RecentTrades";
import { TradeKycBanner } from "@/components/trade/TradeKycBanner";
import { TradeProvider } from "@/components/trade/TradeProvider";
import { TradeSkeleton } from "@/components/trade/TradeStates";
import { TradingHeader } from "@/components/trade/TradingHeader";

const TradingChart = dynamic(
  () => import("@/components/trade/TradingChart").then((m) => m.TradingChart),
  { ssr: false, loading: () => <TradeSkeleton /> }
);

type MobileTab = "chart" | "book" | "trades";

function TradeTerminalContent() {
  const [mobileTab, setMobileTab] = useState<MobileTab>("chart");

  return (
    <div className="space-y-3">
      <TradeKycBanner />
      <TradingHeader />
      <MarketOverviewStrip />

      <div className="flex gap-1 rounded-xl bg-[#0b0e11] p-1 lg:hidden">
        {(
          [
            { id: "chart" as const, label: "Chart" },
            { id: "book" as const, label: "Order Book" },
            { id: "trades" as const, label: "Trades" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-medium transition ${
              mobileTab === tab.id ? "bg-[#161a1e] text-white" : "text-[#848e9c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        {mobileTab === "chart" && <TradingChart />}
        {mobileTab === "book" && <OrderBook />}
        {mobileTab === "trades" && <RecentTrades />}
      </div>

      <div className="hidden space-y-3 lg:block">
        <TradingChart />
        <div className="grid grid-cols-2 gap-3">
          <OrderBook />
          <RecentTrades />
        </div>
      </div>

      <SpotTradePanel />
    </div>
  );
}

export function TradeTerminal() {
  return (
    <TradeProvider>
      <TradeTerminalContent />
    </TradeProvider>
  );
}
