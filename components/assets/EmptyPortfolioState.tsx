"use client";

import Link from "next/link";
import { FiArrowDownCircle, FiTrendingUp } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

type EmptyPortfolioStateProps = {
  onDeposit?: () => void;
};

export function EmptyPortfolioState({ onDeposit }: EmptyPortfolioStateProps) {
  return (
    <div
      className={`${appTheme.card} flex flex-col items-center px-6 py-10 text-center transition duration-300`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0b0e11]">
        <FiTrendingUp className="text-2xl text-[#848e9c]" />
      </div>
      <h3 className="text-lg font-semibold text-white">Your portfolio is empty</h3>
      <p className="mt-2 max-w-xs text-sm text-[#848e9c]">
        Deposit funds to start building your crypto portfolio and track your assets here.
      </p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={onDeposit}
          className={`${appTheme.btnPrimary} flex items-center justify-center gap-2`}
        >
          <FiArrowDownCircle />
          Deposit Funds
        </button>
        <Link
          href="/market"
          className={`${appTheme.btnOutline} flex items-center justify-center gap-2 text-center`}
        >
          Explore Markets
        </Link>
      </div>
    </div>
  );
}
