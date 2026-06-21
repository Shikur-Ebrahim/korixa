"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch, FiStar } from "react-icons/fi";
import { CoinAvatar } from "@/components/landing/market/CoinAvatar";
import type { MarketCoin } from "@/lib/coingecko";
import { formatUsd, formatPercent } from "@/lib/format";
import { appTheme } from "@/components/layout/app-theme";

const FAVORITES_KEY = "korixa-market-favorites";
const PAGE_SIZE = 10;

type ListTab = "favorites" | "spot" | "derivatives" | "tradfi" | "new";
type QuoteFilter = "all" | "usdt" | "usdc" | "btc" | "eth";
type FilterChip = "all" | "margin" | "defi" | "layer1";

type MarketCoinListProps = {
  coins: MarketCoin[];
  newlyListedIds: string[];
};

const MAIN_TABS: { id: ListTab; label: string }[] = [
  { id: "favorites", label: "Favorites" },
  { id: "spot", label: "Spot" },
  { id: "derivatives", label: "Derivatives" },
  { id: "tradfi", label: "TradFi" },
  { id: "new", label: "Newly Listed" },
];

const QUOTE_FILTERS: { id: QuoteFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "usdt", label: "USDT" },
  { id: "usdc", label: "USDC" },
  { id: "btc", label: "BTC" },
  { id: "eth", label: "ETH" },
];

const FILTER_CHIPS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "margin", label: "Margin Trading" },
  { id: "defi", label: "DeFi" },
  { id: "layer1", label: "Layer 1" },
];

const DEFAULT_FAVORITE_IDS = ["bitcoin", "ethereum", "solana", "ripple", "binancecoin"];

const TRADFI_SYMBOLS = new Set([
  "BTC",
  "ETH",
  "USDT",
  "USDC",
  "PAXG",
  "XAUT",
  "EURC",
  "DAI",
  "WBTC",
  "STETH",
]);

const DEFI_SYMBOLS = new Set(["UNI", "AAVE", "LINK", "MKR", "CRV", "COMP", "SNX", "SUSHI"]);
const LAYER1_SYMBOLS = new Set(["BTC", "ETH", "SOL", "AVAX", "ADA", "DOT", "NEAR", "ATOM", "SUI"]);

function loadFavorites(): string[] {
  if (typeof window === "undefined") return DEFAULT_FAVORITE_IDS;
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(DEFAULT_FAVORITE_IDS));
      return DEFAULT_FAVORITE_IDS;
    }
    const parsed = JSON.parse(raw) as string[];
    return parsed.length > 0 ? parsed : DEFAULT_FAVORITE_IDS;
  } catch {
    return DEFAULT_FAVORITE_IDS;
  }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function leverageLabel(rank: number): string {
  if (rank <= 10) return "10X";
  if (rank <= 30) return "5X";
  return "3X";
}

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("ellipsis");

  pages.push(total);
  return pages;
}

export function MarketCoinList({ coins, newlyListedIds }: MarketCoinListProps) {
  const [tab, setTab] = useState<ListTab>("spot");
  const [quote, setQuote] = useState<QuoteFilter>("all");
  const [chip, setChip] = useState<FilterChip>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortByChange, setSortByChange] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, quote, chip, query]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = [...coins];

    if (tab === "favorites") {
      const favSet = new Set(favorites);
      list = list.filter((c) => favSet.has(c.id));
      if (list.length === 0) {
        list = coins.filter((c) => DEFAULT_FAVORITE_IDS.includes(c.id));
      }
    } else if (tab === "new") {
      list = list.filter((c) => newlyListedIds.includes(c.id));
    } else if (tab === "derivatives") {
      list = list.filter((c) => c.rank <= 60);
    } else if (tab === "tradfi") {
      list = list.filter(
        (c) => TRADFI_SYMBOLS.has(c.symbol) || c.symbol.includes("USD") || c.rank <= 15
      );
    }

    if (chip === "defi") {
      list = list.filter((c) => DEFI_SYMBOLS.has(c.symbol));
    } else if (chip === "layer1") {
      list = list.filter((c) => LAYER1_SYMBOLS.has(c.symbol));
    } else if (chip === "margin") {
      list = list.filter((c) => c.rank <= 50);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (sortByChange) {
      list.sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
    } else {
      list.sort((a, b) => a.rank - b.rank);
    }

    return list;
  }, [coins, chip, favorites, newlyListedIds, query, sortByChange, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageCoins = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = buildPageNumbers(safePage, totalPages);

  const quoteSuffix =
    tab === "derivatives"
      ? "USDT Perp"
      : quote === "btc"
        ? "BTC"
        : quote === "eth"
          ? "ETH"
          : quote === "usdc"
            ? "USDC"
            : "USDT";

  const showQuoteFilters = tab !== "new";
  const showFilterChips = true;

  function pairBadge(coin: MarketCoin): string {
    if (tab === "derivatives") return coin.rank <= 20 ? "100X" : "50X";
    if (tab === "tradfi") return "TradFi";
    return leverageLabel(coin.rank);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white">Markets</h3>

      <div className="relative">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className={`${appTheme.input} w-full py-2.5 pl-9 text-sm`}
        />
      </div>

      {/* Primary tabs — horizontal scroll, pill style */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max gap-1 rounded-xl bg-[#0b0e11] p-1">
          {MAIN_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                tab === item.id
                  ? "bg-[#161a1e] text-white shadow-sm"
                  : "text-[#848e9c] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quote currency row */}
      {showQuoteFilters && (
        <div className="-mx-1 flex gap-4 overflow-x-auto border-b border-white/[0.06] px-1 pb-0">
          {QUOTE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setQuote(item.id)}
              className={`relative shrink-0 pb-2.5 text-xs font-medium transition ${
                quote === item.id ? "text-white" : "text-[#848e9c]"
              }`}
            >
              {item.label}
              {quote === item.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {showFilterChips && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTER_CHIPS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setChip(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                chip === item.id
                  ? "bg-primary/15 text-primary"
                  : "border border-white/[0.08] text-[#848e9c]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Column header */}
      <div className="flex items-center justify-between px-1 text-[10px] text-[#848e9c]">
        <span>Trading Pairs</span>
        <button
          type="button"
          onClick={() => setSortByChange((v) => !v)}
          className="flex items-center gap-1 hover:text-white"
        >
          Last Traded Price / 24H Change %
          {sortByChange && <span className="text-primary">↓</span>}
        </button>
      </div>

      {/* List */}
      <div className={`${appTheme.card} overflow-hidden p-0`}>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-[#848e9c]">
            No coins match your filters. Try another tab or search.
          </p>
        ) : (
          pageCoins.map((coin) => {
            const positive = (coin.change24h ?? 0) >= 0;
            const starred = favorites.includes(coin.id);

            return (
              <div
                key={coin.id}
                className="flex items-center gap-2.5 border-b border-white/[0.04] px-3 py-3.5 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => toggleFavorite(coin.id)}
                  aria-label={starred ? "Remove favorite" : "Add favorite"}
                  className="shrink-0 text-[#848e9c] hover:text-primary"
                >
                  <FiStar className={starred ? "fill-primary text-primary" : ""} />
                </button>

                <CoinAvatar src={coin.image} symbol={coin.symbol} size={30} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-semibold text-white">
                      {coin.symbol}
                      <span className="font-normal text-[#848e9c]">/{quoteSuffix}</span>
                    </p>
                    <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary">
                      {pairBadge(coin)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-white">{formatUsd(coin.price)}</p>
                  <p
                    className={`text-xs font-medium ${positive ? appTheme.positive : appTheme.negative}`}
                  >
                    {formatPercent(coin.change24h)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination — show when more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 pt-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#848e9c] transition hover:bg-white/[0.04] disabled:opacity-30"
            aria-label="Previous page"
          >
            <FiChevronLeft />
          </button>

          {pageNumbers.map((num, i) =>
            num === "ellipsis" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-[#848e9c]">
                …
              </span>
            ) : (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                  safePage === num
                    ? "bg-primary text-[#0b0e11]"
                    : "border border-white/[0.08] text-[#848e9c] hover:bg-white/[0.04]"
                }`}
              >
                {num}
              </button>
            )
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-[#848e9c] transition hover:bg-white/[0.04] disabled:opacity-30"
            aria-label="Next page"
          >
            <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}
