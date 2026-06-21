"use client";

import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiClock,
  FiRepeat,
} from "react-icons/fi";

type QuickActionsProps = {
  onDeposit?: () => void;
  onWithdraw?: () => void;
  onTransfer?: () => void;
  onHistory?: () => void;
};

const ACTIONS = [
  { id: "deposit", label: "Deposit", icon: FiArrowDownCircle, color: "text-secondary" },
  { id: "withdraw", label: "Withdraw", icon: FiArrowUpCircle, color: "text-red-400" },
  { id: "transfer", label: "Transfer", icon: FiRepeat, color: "text-primary" },
  { id: "history", label: "History", icon: FiClock, color: "text-[#eaecef]" },
] as const;

export function QuickActions({ onDeposit, onWithdraw, onTransfer, onHistory }: QuickActionsProps) {
  const handlers: Record<(typeof ACTIONS)[number]["id"], (() => void) | undefined> = {
    deposit: onDeposit,
    withdraw: onWithdraw,
    transfer: onTransfer,
    history: onHistory,
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={handlers[action.id]}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-[#161a1e] py-3.5 transition duration-200 hover:border-white/10 hover:bg-white/[0.04] active:scale-[0.97]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b0e11] transition group-hover:scale-105">
              <Icon className={`text-lg ${action.color}`} />
            </span>
            <span className="text-[11px] font-medium text-[#eaecef]">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
