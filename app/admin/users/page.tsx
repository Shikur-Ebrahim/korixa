"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type AdminUser = {
  uid: string;
  email: string;
  kycStatus: string;
  role: string;
  createdAt: string;
};

const KYC_BADGE: Record<string, string> = {
  verified: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  pending: "border-primary/30 bg-primary/10 text-primary",
  rejected: "border-red-400/30 bg-red-400/10 text-red-400",
};

export default function AdminUsersPage() {
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fundingUser, setFundingUser] = useState<AdminUser | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundLoading, setFundLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { users: AdminUser[] };
      setUsers(data.users ?? []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [getIdToken]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.kycStatus.includes(search.toLowerCase())
  );

  const handleFund = async () => {
    if (!fundingUser || !fundAmount) return;
    setFundLoading(true);
    try {
      const token = await getIdToken();
      await fetch("/api/admin/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUid: fundingUser.uid,
          amount: Number(fundAmount),
          reason: "Manual P2P/Funding deposit",
        }),
      });
      alert(`Successfully added ${fundAmount} USDT to ${fundingUser.email}`);
      setFundingUser(null);
      setFundAmount("");
    } catch (e) {
      alert("Failed to fund user");
    } finally {
      setFundLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Users</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">{users.length} total registered accounts</p>
      </div>

      <input
        type="text"
        placeholder="Search by email or KYC status..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#848e9c] focus:border-primary/50"
      />

      <div className="space-y-2">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))
          : filtered.length === 0
          ? <p className="py-8 text-center text-sm text-[#848e9c]">No users found.</p>
          : filtered.map((u) => (
              <div
                key={u.uid}
                className="rounded-xl border border-white/[0.06] bg-[#161a1e] px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{u.email}</p>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-[#848e9c]">{u.uid.slice(0, 8)}...</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${
                          KYC_BADGE[u.kycStatus] ?? KYC_BADGE.pending
                        }`}
                      >
                        {u.kycStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      onClick={() => setFundingUser(u)}
                      className="inline-flex items-center rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                    >
                      Fund USDT
                    </button>
                    {u.role === "admin" && (
                      <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Manual Fund Modal */}
      {fundingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#161a1e] p-6 shadow-xl border border-white/[0.06]">
            <h3 className="text-lg font-bold text-white mb-1">Fund Wallet</h3>
            <p className="text-xs text-[#848e9c] mb-5">Add USDT to {fundingUser.email}</p>
            
            <label className="block text-xs font-medium text-[#848e9c] mb-1.5">Amount (USDT)</label>
            <input
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] px-4 py-3 text-sm text-white outline-none focus:border-primary/50 mb-5"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setFundingUser(null)}
                className="flex-1 rounded-xl bg-white/[0.04] py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={handleFund}
                disabled={fundLoading || !fundAmount}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90 disabled:opacity-50"
              >
                {fundLoading ? "Funding..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
