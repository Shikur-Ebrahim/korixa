"use client";

import type { DepositChain } from "@/lib/deposit/constants";
import { CHAIN_CONFIG } from "@/lib/deposit/constants";

type ChainSelectorProps = {
  value: DepositChain;
  onChange: (chain: DepositChain) => void;
  disabled?: boolean;
};

const CHAINS: DepositChain[] = ["bsc", "polygon"];

export function ChainSelector({ value, onChange, disabled }: ChainSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CHAINS.map((chain) => {
        const config = CHAIN_CONFIG[chain];
        const active = value === chain;

        return (
          <button
            key={chain}
            type="button"
            disabled={disabled}
            onClick={() => onChange(chain)}
            className={`rounded-xl border px-3 py-3 text-left transition duration-200 ${
              active
                ? "border-primary/50 bg-primary/10"
                : "border-white/[0.06] bg-[#161a1e] hover:border-white/10"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <p className="text-sm font-semibold text-white">{config.label}</p>
            <p className="mt-0.5 text-[11px] text-[#848e9c]">{config.tokenStandard}</p>
          </button>
        );
      })}
    </div>
  );
}
