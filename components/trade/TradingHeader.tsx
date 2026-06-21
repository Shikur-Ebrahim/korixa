"use client";

import { useMemo, useState } from "react";
import { FiChevronDown, FiSearch, FiStar } from "react-icons/fi";
import { useTrade } from "@/components/trade/TradeProvider";
import { useBinanceTicker } from "@/hooks/useBinanceMarket";
import { DEFAULT_PAIRS } from "@/lib/binance/types";
import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

export function TradingHeader() {
  const { pair, setPair, favorites, toggleFavorite } = useTrade();
  const { data: ticker, isLoading } = useBinanceTicker(pair.symbol);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const change = parseFloat(ticker?.priceChangePercent ?? "0");
  const positive = change >= 0;

  const filteredPairs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEFAULT_PAIRS;
    return DEFAULT_PAIRS.filter(
      (p) =>
        p.base.toLowerCase().includes(q) ||
        p.symbol.toLowerCase().includes(q) ||
        p.label.toLowerCase().includes(q)
    );
  }, [search]);

  const favoritePairs = DEFAULT_PAIRS.filter((p) => favorites.includes(p.symbol));

  return (
    <div className={`${appTheme.card} relative space-y-3 p-0 overflow-visible`}>
      <button
        type="button"
        onClick={() => setSelectorOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-white">{pair.label}</p>
            <FiChevronDown
              className={`text-[#848e9c] transition ${selectorOpen ? "rotate-180" : ""}`}
            />
          </div>
          {isLoading ? (
            <div className="mt-1 h-6 w-28 animate-pulse rounded bg-white/5" />
          ) : (
            <p className="mt-0.5 text-xl font-bold text-white">
              {formatUsd(parseFloat(ticker?.lastPrice ?? "0"))}
            </p>
          )}
        </div>
        {!isLoading && ticker && (
          <div className="text-right">
            <span
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                positive ? "bg-secondary/10 text-secondary" : "bg-red-500/10 text-red-400"
              }`}
            >
              {formatPercent(change)}
            </span>
            <p className="mt-1 text-[10px] text-[#848e9c]">
              Vol {formatUsd(parseFloat(ticker.quoteVolume), true)}
            </p>
          </div>
        )}
      </button>

      {ticker && (
        <div className="grid grid-cols-4 gap-2 border-t border-white/[0.06] px-4 py-3 text-[10px]">
          <div>
            <p className="text-[#848e9c]">24h High</p>
            <p className="font-medium text-white">{formatUsd(parseFloat(ticker.highPrice))}</p>
          </div>
          <div>
            <p className="text-[#848e9c]">24h Low</p>
            <p className="font-medium text-white">{formatUsd(parseFloat(ticker.lowPrice))}</p>
          </div>
          <div>
            <p className="text-[#848e9c]">24h Vol</p>
            <p className="font-medium text-white">{formatUsd(parseFloat(ticker.quoteVolume), true)}</p>
          </div>
          <div>
            <p className="text-[#848e9c]">Last</p>
            <p className="font-medium text-white">{formatUsd(parseFloat(ticker.lastPrice))}</p>
          </div>
        </div>
      )}

      {selectorOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-2xl border border-white/[0.08] bg-[#161a1e] shadow-2xl">
          <div className="border-b border-white/[0.06] p-3">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#848e9c]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search BTC, ETH, SOL..."
                className={`${appTheme.input} py-2 pl-8 text-xs`}
              />
            </div>
          </div>

          {favoritePairs.length > 0 && !search && (
            <div className="border-b border-white/[0.06] p-2">
              <p className="mb-1 px-2 text-[10px] font-medium uppercase text-[#848e9c]">
                Favorites
              </p>
              {favoritePairs.map((p) => (
                <PairRow
                  key={p.symbol}
                  pair={p}
                  active={p.symbol === pair.symbol}
                  starred={favorites.includes(p.symbol)}
                  onSelect={() => {
                    setPair(p);
                    setSelectorOpen(false);
                    setSearch("");
                  }}
                  onToggleStar={() => toggleFavorite(p.symbol)}
                />
              ))}
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-2">
            {filteredPairs.map((p) => (
              <PairRow
                key={p.symbol}
                pair={p}
                active={p.symbol === pair.symbol}
                starred={favorites.includes(p.symbol)}
                onSelect={() => {
                  setPair(p);
                  setSelectorOpen(false);
                  setSearch("");
                }}
                onToggleStar={() => toggleFavorite(p.symbol)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PairRow({
  pair,
  active,
  starred,
  onSelect,
  onToggleStar,
}: {
  pair: (typeof DEFAULT_PAIRS)[0];
  active: boolean;
  starred: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg px-2 py-2 ${
        active ? "bg-primary/10" : "hover:bg-white/[0.03]"
      }`}
    >
      <button type="button" onClick={onSelect} className="flex-1 text-left text-sm text-white">
        {pair.label}
      </button>
      <button
        type="button"
        onClick={onToggleStar}
        className="p-1 text-[#848e9c] hover:text-primary"
        aria-label="Toggle favorite"
      >
        <FiStar className={starred ? "fill-primary text-primary" : ""} />
      </button>
    </div>
  );
}
