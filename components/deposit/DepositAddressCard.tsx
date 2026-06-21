"use client";

type DepositAddressCardProps = {
  address: string;
  networkLabel: string;
  token: string;
  minDeposit: number;
};

export function DepositAddressCard({
  address,
  networkLabel,
  token,
  minDeposit,
}: DepositAddressCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#848e9c]">Deposit Address</p>
        <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
          {networkLabel}
        </span>
      </div>
      <p className="break-all font-mono text-sm leading-relaxed text-white">{address}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#848e9c]">
        <span className="rounded-md bg-white/[0.04] px-2 py-1">Token: {token}</span>
        <span className="rounded-md bg-white/[0.04] px-2 py-1">Min: {minDeposit} USDT</span>
      </div>
    </div>
  );
}
