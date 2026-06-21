"use client";

import { FiCreditCard } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

export function BuyCryptoCard() {
  return (
    <div className={`${appTheme.card} transition duration-200 hover:border-white/10`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-primary">
          <FiCreditCard className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Buy Crypto</p>
          <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">
            Buy crypto using card, bank transfer, or local payment methods.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#0b0e11] transition hover:opacity-90"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
