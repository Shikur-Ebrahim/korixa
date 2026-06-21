"use client";

import { FiDollarSign } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

export function FiatDepositCard() {
  return (
    <div className={`${appTheme.card} transition duration-200 hover:border-white/10`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-[#eaecef]">
          <FiDollarSign className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Fiat Deposit</p>
          <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">
            Add funds using bank transfer, debit card, or supported payment methods.
          </p>
          <button
            type="button"
            className="mt-3 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.04]"
          >
            Deposit Funds
          </button>
        </div>
      </div>
    </div>
  );
}
