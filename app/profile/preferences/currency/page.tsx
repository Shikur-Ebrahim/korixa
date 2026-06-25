"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiCheck, FiSearch } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";
import { useState } from "react";

const CURRENCIES = [
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br", active: true },
  { code: "USD", name: "US Dollar", symbol: "$", active: false },
  { code: "EUR", name: "Euro", symbol: "€", active: false },
  { code: "GBP", name: "British Pound", symbol: "£", active: false },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", active: false },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", active: false },
];

export default function CurrencyPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Currency</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        <div className="mb-6">
          <h1 className={appTheme.title}>Display Currency</h1>
          <p className={appTheme.subtitle}>
            Select your preferred local currency for P2P trading and portfolio value.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-[#848e9c]" />
          </div>
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] py-3 pl-10 pr-4 text-xs md:text-sm text-white outline-none placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        <div className={appTheme.card}>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((currency) => (
              <button
                key={currency.code}
                disabled={!currency.active}
                className={`flex w-full items-center justify-between py-3.5 px-2 -mx-2 transition ${
                  currency.active 
                    ? "opacity-100 hover:bg-white/[0.04] rounded-lg" 
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${currency.active ? 'bg-primary/20 text-primary' : 'bg-white/[0.04] text-[#848e9c]'}`}>
                    {currency.symbol}
                  </div>
                  <div className="text-left">
                    <div className={`text-xs md:text-sm font-bold ${currency.active ? "text-white" : "text-[#848e9c]"}`}>
                      {currency.code}
                    </div>
                    <div className="text-[10px] md:text-xs text-[#848e9c]">
                      {currency.name}
                    </div>
                  </div>
                </div>
                {currency.active && (
                  <FiCheck className="text-primary" size={18} />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-[#848e9c]">
                No currencies found.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
