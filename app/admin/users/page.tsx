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
                    <p className="mt-0.5 text-[10px] text-[#848e9c]">
                      {u.uid.slice(0, 12)}… · {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${KYC_BADGE[u.kycStatus] ?? "border-white/10 bg-white/5 text-[#848e9c]"}`}>
                      {u.kycStatus}
                    </span>
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
    </div>
  );
}
