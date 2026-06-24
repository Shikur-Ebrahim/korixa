import { AppShell } from "@/components/layout/AppShell";
import { TradeTerminal } from "@/components/trade/TradeTerminal";

export default function TradePage() {
  return (
    <AppShell>
      {/* Spot Trading header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Spot Trading</h1>
          <p className="text-xs text-[#848e9c]">Live market prices · Binance data</p>
        </div>
      </div>

      <TradeTerminal />
    </AppShell>
  );
}
