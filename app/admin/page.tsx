"use client";

import { useCallback, useEffect, useState } from "react";
import { FiUsers, FiArrowDownCircle, FiArrowUpCircle, FiShield } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

type Stats = {
  totalUsers: number;
  totalDeposits: number;
  pendingWithdrawals: number;
  pendingKyc: number;
  recentUsers: { uid: string; email: string; kycStatus: string; createdAt: string }[];
};

const KYC_COLORS: Record<string, string> = {
  verified: "text-emerald-400",
  pending: "text-primary",
  rejected: "text-red-400",
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
        <Icon style={{ color }} className="text-base" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs text-[#848e9c]">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { getIdToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load stats");
      setStats(await res.json() as Stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading stats");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">Korixa platform overview</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))
        ) : (
          <>
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={FiUsers} color="#F7931A" />
            <StatCard label="Total Deposits" value={stats?.totalDeposits ?? 0} icon={FiArrowDownCircle} color="#10b981" />
            <Link href="/admin/withdrawals" className="block transition hover:opacity-80">
              <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={FiArrowUpCircle} color="#6366f1" />
            </Link>
            <StatCard label="Pending KYC" value={stats?.pendingKyc ?? 0} icon={FiShield} color="#f59e0b" />
          </>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
        <Link href="/admin/crypto-deposits" className="col-span-2 flex items-center gap-3 rounded-xl border border-white/10 bg-[#1e2329] p-4 transition hover:bg-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500">
            <FiShield size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Crypto Deposits</p>
            <p className="text-[10px] text-[#848e9c]">Manual verification queue</p>
          </div>
        </Link>
        <Link href="/admin/deposit-networks" className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1e2329] p-3 transition hover:bg-white/5 text-sm font-medium text-white">
          Manage Deposit Networks
        </Link>
      </div>

      {/* Recent users */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Recent Users</h2>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
              ))
            : stats?.recentUsers.map((u) => (
                <div
                  key={u.uid}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161a1e] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{u.email}</p>
                    <p className="text-[10px] text-[#848e9c]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className={`ml-2 shrink-0 text-[10px] font-semibold uppercase ${KYC_COLORS[u.kycStatus] ?? "text-[#848e9c]"}`}>
                    {u.kycStatus}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
