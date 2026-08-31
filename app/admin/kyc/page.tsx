"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiCheck, FiX, FiRefreshCw, FiUser, FiMail, FiShield } from "react-icons/fi";

type KycUser = {
  uid: string;
  email: string;
  fullName?: string;
  kycStatus: string;
  idImageUrl: string | null;
  selfieImageUrl: string | null;
  faceMatchScore: number | null;
  rejectionReason: string | null;
  updatedAt: string;
};

type Filter = "all" | "pending" | "verified" | "rejected";

const TABS: { id: Filter; label: string; color: string }[] = [
  { id: "all", label: "All", color: "" },
  { id: "pending", label: "Pending", color: "text-amber-400" },
  { id: "verified", label: "Verified", color: "text-emerald-400" },
  { id: "rejected", label: "Rejected", color: "text-red-400" },
];

export default function AdminKycPage() {
  const { getIdToken } = useAuth();
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);

  // Manual verify form
  const [manualEmail, setManualEmail] = useState("");
  const [manualFullName, setManualFullName] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setSpinning(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { users: KycUser[] };
      setUsers(data.users ?? []);
    } catch { /* silently fail */ }
    finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 600);
    }
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
    if (!confirm("Delete this user's KYC data? They will need to resubmit.")) return;
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
    } finally { setBusy(null); }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim() || !manualFullName.trim()) return;
    setManualLoading(true);
    setManualResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/kyc/verify-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: manualEmail.trim(), fullName: manualFullName.trim() }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string };
      if (res.ok && data.ok) {
        setManualResult({ ok: true, msg: data.message ?? "User verified successfully!" });
        setManualEmail("");
        setManualFullName("");
        // refresh list
        void fetchUsers();
      } else {
        setManualResult({ ok: false, msg: data.error ?? "Verification failed." });
      }
    } catch {
      setManualResult({ ok: false, msg: "Network error. Please try again." });
    } finally {
      setManualLoading(false);
    }
  };

  const filtered = filter === "all" ? users : users.filter((u) => u.kycStatus === filter);

  const counts = {
    all: users.length,
    pending: users.filter(u => u.kycStatus === "pending").length,
    verified: users.filter(u => u.kycStatus === "verified").length,
    rejected: users.filter(u => u.kycStatus === "rejected").length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">KYC Verification</h1>
          <p className="mt-0.5 text-xs text-[#848e9c]">Review and approve identity submissions</p>
        </div>
        <button
          onClick={() => void fetchUsers()}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-2 text-xs font-medium text-[#848e9c] hover:text-white transition"
        >
          <FiRefreshCw size={13} className={spinning ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Manual Verify Card */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
            <FiShield size={15} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Manual Verification</p>
            <p className="text-[10px] text-[#848e9c]">Instantly verify any user by their email address</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleManualVerify(e)} className="space-y-2.5">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="relative">
              <FiMail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
              <input
                type="email"
                placeholder="User email address"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] pl-8 pr-3 py-2.5 text-xs text-white placeholder-[#848e9c] focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div className="relative">
              <FiUser size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848e9c]" />
              <input
                type="text"
                placeholder="Full name (as on ID)"
                value={manualFullName}
                onChange={(e) => setManualFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] pl-8 pr-3 py-2.5 text-xs text-white placeholder-[#848e9c] focus:border-blue-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={manualLoading || !manualEmail.trim() || !manualFullName.trim()}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {manualLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying...
              </span>
            ) : (
              "✓ Verify User Instantly"
            )}
          </button>
        </form>

        {manualResult && (
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
            manualResult.ok
              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
              : "bg-red-400/10 text-red-400 border border-red-400/20"
          }`}>
            {manualResult.ok ? <FiCheck size={13} /> : <FiX size={13} />}
            {manualResult.msg}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.id
                ? "bg-primary text-[#0b0e11]"
                : "border border-white/[0.08] bg-[#161a1e] text-[#848e9c]"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              filter === tab.id ? "bg-black/20 text-[#0b0e11]" : "bg-white/[0.06] text-[#848e9c]"
            }`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

      {/* User Cards */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
            ))
          : filtered.length === 0
          ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                <FiUser size={20} className="text-[#848e9c]" />
              </div>
              <p className="text-sm text-[#848e9c]">No {filter} submissions</p>
            </div>
          )
          : filtered.map((u) => (
              <div key={u.uid} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <FiUser size={15} className="text-[#848e9c]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.email}</p>
                      {u.fullName && (
                        <p className="text-[10px] text-[#848e9c]">{u.fullName}</p>
                      )}
                      <p className="text-[10px] text-[#848e9c]">
                        {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                    u.kycStatus === "verified" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    : u.kycStatus === "rejected" ? "border-red-400/30 bg-red-400/10 text-red-400"
                    : "border-amber-400/30 bg-amber-400/10 text-amber-400"
                  }`}>
                    {u.kycStatus}
                  </span>
                </div>

                {/* Images */}
                {(u.idImageUrl || u.selfieImageUrl) && (
                  <div className="flex flex-wrap gap-3">
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
                    ✕ {u.rejectionReason}
                  </p>
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-1">
                  {u.kycStatus !== "verified" && (
                    <div className="flex gap-2">
                      <button
                        disabled={!!busy}
                        onClick={() => void handleKycAction(u.uid, "approve")}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        <FiCheck size={13} />
                        {busy === u.uid + "approve" ? "Verifying..." : "Approve & Verify"}
                      </button>
                      {u.kycStatus === "pending" && (
                        <button
                          disabled={!!busy}
                          onClick={() => void handleKycAction(u.uid, "reject")}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-400/10 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
                        >
                          <FiX size={13} />
                          {busy === u.uid + "reject" ? "..." : "Reject"}
                        </button>
                      )}
                    </div>
                  )}

                  {u.kycStatus === "verified" && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-400/5 border border-emerald-400/20 px-3 py-2">
                      <FiCheck size={13} className="text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-400">Identity Verified</span>
                    </div>
                  )}

                  <div className="border-t border-white/[0.06] pt-2">
                    <button
                      disabled={!!busy}
                      onClick={() => void handleKycDelete(u.uid)}
                      className="w-full rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {busy === u.uid + "delete" ? "Deleting..." : "Delete KYC Data"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
