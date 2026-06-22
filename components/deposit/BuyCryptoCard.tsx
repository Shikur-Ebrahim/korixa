"use client";

import { FiCreditCard, FiClock } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

export function BuyCryptoCard() {
  return (
    <div className={`${appTheme.card} opacity-80`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-[#848e9c]">
          <FiCreditCard className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Buy Crypto</p>
            <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <FiClock className="text-[10px]" />
              Coming Soon
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">
            Buy crypto using card, bank transfer, or local payment methods.
          </p>
        </div>
      </div>
    </div>
  );
}
