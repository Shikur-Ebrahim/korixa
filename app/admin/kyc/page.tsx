"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type KycUser = {
  uid: string;
  email: string;
  kycStatus: string;
  idImageUrl: string | null;
  selfieImageUrl: string | null;
  faceMatchScore: number | null;
  rejectionReason: string | null;
  updatedAt: string;
};

type Filter = "all" | "pending" | "verified" | "rejected";

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

export default function AdminKycPage() {
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { users: KycUser[] };
      setUsers(data.users ?? []);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [getIdToken]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const handleKycAction = async (uid: string, action: "approve" | "reject") => {
    setBusy(uid + action);
    try {
      const token = await getIdToken();
      const reason = action === "reject" ? prompt("Rejection reason (optional):") ?? "Rejected by admin." : undefined;
      const res = await fetch(`/api/admin/kyc/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid
              ? { ...u, kycStatus: action === "approve" ? "verified" : "rejected" }
              : u
          )
        );
      }
    } finally { setBusy(null); }
  };

  const handleKycDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to completely delete this user's KYC data? This will revert them to an unverified state.")) return;
    setBusy(uid + "delete");
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/kyc/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.uid === uid ? { ...u, kycStatus: "pending", rejectionReason: null, idImageUrl: null, selfieImageUrl: null, faceMatchScore: null } : u
          )
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const filtered = filter === "all" ? users : users.filter((u) => u.kycStatus === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">KYC Verification</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">Review and approve identity submissions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.id
                ? "bg-primary text-[#0b0e11]"
                : "border border-white/[0.08] bg-[#161a1e] text-[#848e9c]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
            ))
          : filtered.length === 0
          ? <p className="py-10 text-center text-sm text-[#848e9c]">No {filter} submissions.</p>
          : filtered.map((u) => (
              <div key={u.uid} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{u.email}</p>
                    <p className="text-[10px] text-[#848e9c]">
                      {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                    u.kycStatus === "verified" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    : u.kycStatus === "rejected" ? "border-red-400/30 bg-red-400/10 text-red-400"
                    : "border-primary/30 bg-primary/10 text-primary"
                  }`}>
                    {u.kycStatus}
                  </span>
                </div>

                {/* ID + Selfie thumbnails */}
                {(u.idImageUrl || u.selfieImageUrl) && (
                  <div className="flex gap-2">
                    {u.idImageUrl && (
                      <a href={u.idImageUrl} target="_blank" rel="noreferrer" className="block">
                        <img src={u.idImageUrl} alt="ID" className="h-20 w-28 rounded-lg object-cover border border-white/[0.06]" />
                        <p className="mt-0.5 text-[10px] text-[#848e9c]">ID Photo</p>
                      </a>
                    )}
                    {u.selfieImageUrl && (
                      <a href={u.selfieImageUrl} target="_blank" rel="noreferrer" className="block">
                        <img src={u.selfieImageUrl} alt="Selfie" className="h-20 w-20 rounded-lg object-cover border border-white/[0.06]" />
                        <p className="mt-0.5 text-[10px] text-[#848e9c]">Selfie</p>
                      </a>
                    )}
                    {u.faceMatchScore != null && (
                      <div className="flex flex-col justify-center px-2">
                        <p className="text-[10px] text-[#848e9c]">Face Match</p>
                        <p className={`text-lg font-bold ${u.faceMatchScore >= 70 ? "text-emerald-400" : "text-red-400"}`}>
                          {u.faceMatchScore}%
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {u.rejectionReason && (
                  <p className="rounded-lg bg-red-400/10 px-2 py-1.5 text-xs text-red-400">
                    {u.rejectionReason}
                  </p>
                )}

                {u.kycStatus === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      disabled={!!busy}
                      onClick={() => void handleKycAction(u.uid, "approve")}
                      className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {busy === u.uid + "approve" ? "…" : "✓ Approve"}
                    </button>
                    <button
                      disabled={!!busy}
                      onClick={() => void handleKycAction(u.uid, "reject")}
                      className="flex-1 rounded-xl border border-red-400/30 bg-red-400/10 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
                    >
                      {busy === u.uid + "reject" ? "…" : "✕ Reject"}
                    </button>
                  </div>
                )}
                
                {/* Delete KYC Button */}
                <div className="pt-2 border-t border-white/[0.06] mt-2">
                  <button
                    disabled={!!busy}
                    onClick={() => void handleKycDelete(u.uid)}
                    className="w-full rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {busy === u.uid + "delete" ? "Deleting..." : "Completely Delete KYC Data"}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
