"use client";

import { FiRepeat } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

type TransferCardProps = {
  onTransfer?: () => void;
};

export function TransferCard({ onTransfer }: TransferCardProps) {
  return (
    <div className={`${appTheme.card} transition duration-200 hover:border-white/10`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-primary">
          <FiRepeat className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Transfer Assets</p>
          <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">
            Move funds between internal wallets and trading accounts.
          </p>
          <button
            type="button"
            onClick={onTransfer}
            className="mt-3 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.04]"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
