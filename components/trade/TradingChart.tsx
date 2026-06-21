"use client";

import { useEffect, useId, useRef } from "react";
import { useTrade } from "@/components/trade/TradeProvider";
import { CHART_INTERVALS } from "@/lib/binance/types";
import { appTheme } from "@/components/layout/app-theme";

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

export function TradingChart() {
  const { pair, chartInterval, setChartInterval } = useTrade();
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const chartId = `tv-chart-${pair.symbol}-${reactId}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (!window.TradingView || !containerRef.current) return;

      new window.TradingView.widget({
        autosize: true,
        symbol: `BINANCE:${pair.symbol}`,
        interval: chartInterval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0b0e11",
        enable_publishing: false,
        hide_top_toolbar: true,
        hide_legend: false,
        save_image: false,
        container_id: chartId,
        backgroundColor: "#0b0e11",
        gridColor: "rgba(255,255,255,0.06)",
      });
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pair.symbol, chartInterval, chartId]);

  return (
    <div className={`${appTheme.card} overflow-hidden p-0`}>
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] p-2">
        {CHART_INTERVALS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setChartInterval(item.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
              chartInterval === item.id
                ? "bg-primary/15 text-primary"
                : "text-[#848e9c] hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div id={chartId} ref={containerRef} className="h-[280px] w-full" />
    </div>
  );
}

