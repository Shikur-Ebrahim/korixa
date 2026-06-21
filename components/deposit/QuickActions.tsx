"use client";

import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiClock,
  FiRepeat,
} from "react-icons/fi";

type DepositQuickActionsProps = {
  onHistory?: () => void;
};

export function DepositQuickActions({ onHistory }: DepositQuickActionsProps) {
  const actions = [
    { label: "Deposit", icon: FiArrowDownCircle, color: "text-secondary", active: true },
    { label: "Withdraw", icon: FiArrowUpCircle, color: "text-red-400" },
    { label: "Transfer", icon: FiRepeat, color: "text-primary" },
    { label: "History", icon: FiClock, color: "text-[#eaecef]", onClick: onHistory },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-medium transition duration-200 ${
              action.active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-white/[0.06] bg-[#161a1e] text-[#eaecef] hover:bg-white/[0.04]"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b0e11]">
              <Icon className={`text-base ${action.color}`} />
            </span>
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
