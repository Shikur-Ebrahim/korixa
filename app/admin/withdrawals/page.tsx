"use client";

import { FiArrowUpCircle } from "react-icons/fi";

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Withdrawals</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">Platform withdrawal requests</p>
      </div>

      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161a1e]">
          <FiArrowUpCircle className="text-2xl text-[#848e9c]" />
        </div>
        <p className="text-sm font-medium text-white">Coming Soon</p>
        <p className="max-w-xs text-xs text-[#848e9c]">
          Withdrawal management will be available in the next release. Transactions will appear here once the withdrawal feature is live.
        </p>
      </div>
    </div>
  );
}
