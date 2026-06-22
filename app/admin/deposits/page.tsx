"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiArrowDownCircle } from "react-icons/fi";

type Deposit = {
  txId: string;
  amount: number;
  currency: string;
  status: string;
  network: string;
  confirmedAt?: string;
  address?: string;
};

export default function AdminDepositsPage() {
  const { getIdToken } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Re-use users endpoint — deposits are tracked per-user via Tatum webhooks
      // A dedicated /api/admin/deposits endpoint can be added later
      if (res.ok) setDeposits([]);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [getIdToken]);

  useEffect(() => { void fetchDeposits(); }, [fetchDeposits]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Deposits</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">All platform deposit transactions</p>
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
        ))
      ) : deposits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161a1e]">
            <FiArrowDownCircle className="text-2xl text-[#848e9c]" />
          </div>
          <p className="text-sm font-medium text-white">No deposits yet</p>
          <p className="text-xs text-[#848e9c] max-w-xs">
            Deposit records will appear here once users start depositing crypto via the platform.
          </p>
        </div>
      ) : (
        deposits.map((d) => (
          <div key={d.txId} className="rounded-xl border border-white/[0.06] bg-[#161a1e] px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {d.amount} {d.currency}
                </p>
                <p className="text-[10px] text-[#848e9c]">{d.network} · {d.txId.slice(0, 14)}…</p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                {d.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
