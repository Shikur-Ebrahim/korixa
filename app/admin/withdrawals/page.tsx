"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FiClock, FiCheckCircle, FiXCircle, FiCopy, FiCheck,
  FiArrowUpRight, FiRefreshCw, FiFilter, FiUser
} from "react-icons/fi";

type Withdrawal = {
  id: string;
  userId: string;
  type: "crypto_onchain" | "internal_transfer" | "fiat_etb";
  coin: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: "pending" | "completed" | "rejected";
  destination: any;
  network?: string;
  etbRate?: number;
  createdAt: string;
  processedAt?: string;
};

function statusBadge(status: string) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold text-yellow-400">
        <FiClock size={10} /> Pending
      </span>
    );
  if (status === "completed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-400">
        <FiCheckCircle size={10} /> Completed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400">
      <FiXCircle size={10} /> Rejected
    </span>
  );
}

function typeLabel(type: string) {
  if (type === "crypto_onchain") return "On-Chain";
  if (type === "internal_transfer") return "Internal Transfer";
  if (type === "fiat_etb") return "Sell for ETB";
  return type;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="ml-1 p-1 rounded text-[#848e9c] hover:text-white transition"
      title="Copy"
    >
      {copied ? <FiCheck size={12} className="text-green-400" /> : <FiCopy size={12} />}
    </button>
  );
}

export default function AdminWithdrawalsPage() {
  const { getIdToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/withdrawals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWithdrawals(data.withdrawals ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleAction = async (withdrawalId: string, action: "approve" | "reject") => {
    if (!window.confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    setActionLoading(withdrawalId + action);
    setMsg(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/withdrawals/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ withdrawalId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ id: withdrawalId, text: action === "approve" ? "Approved!" : "Rejected & refunded", ok: true });
        fetchWithdrawals();
      } else {
        setMsg({ id: withdrawalId, text: data.error ?? "Failed", ok: false });
      }
    } catch (e) {
      setMsg({ id: withdrawalId, text: "Network error", ok: false });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = withdrawals.filter((w) => filter === "all" || w.status === filter);

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Withdrawals</h1>
          <p className="mt-0.5 text-xs text-[#848e9c]">Platform withdrawal requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-medium text-[#848e9c] hover:text-white transition"
        >
          <FiRefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: withdrawals.length, color: "text-white" },
          { label: "Pending", value: pendingCount, color: "text-yellow-400" },
          { label: "Completed", value: withdrawals.filter((w) => w.status === "completed").length, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-[#161a1e] border border-white/[0.06] p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#848e9c] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-xl bg-[#1e2329] p-1">
        {(["all", "pending", "completed", "rejected"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${
              filter === tab ? "bg-[#2b3139] text-white shadow" : "text-[#848e9c] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Withdrawal Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-white/5 rounded" />
              <div className="h-3 w-48 bg-white/5 rounded" />
              <div className="h-3 w-40 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-8 text-center text-sm text-[#848e9c]">
          No {filter !== "all" ? filter : ""} withdrawals found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const isOnchain = w.type === "crypto_onchain";
            const isEtb = w.type === "fiat_etb";
            const isInternal = w.type === "internal_transfer";
            const dest =
              typeof w.destination === "string"
                ? w.destination
                : w.destination?.accountNumber ?? "";
            const destLabel =
              isOnchain
                ? `${w.network ?? "TRC20"} Address`
                : isEtb
                ? "CBE Account"
                : "Recipient";

            return (
              <div key={w.id} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-3 space-y-3">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isEtb ? "bg-purple-500/10 text-purple-400" : isInternal ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"
                    }`}>
                      <FiArrowUpRight size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {w.amount.toFixed(2)} {w.coin}
                        {isEtb && w.etbRate && (
                          <span className="text-[#848e9c] font-normal ml-1 text-xs">
                            ≈ {(w.amount * w.etbRate).toFixed(0)} ETB
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-[#848e9c]">{typeLabel(w.type)}</p>
                    </div>
                  </div>
                  {statusBadge(w.status)}
                </div>

                {/* User UID */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#848e9c]">
                  <FiUser size={11} />
                  <span className="font-mono">{w.userId.slice(0, 20)}…</span>
                  <CopyButton text={w.userId} />
                </div>

                {/* Destination */}
                <div className="rounded-xl bg-[#0b0e11] border border-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-[#848e9c] mb-1">{destLabel}</p>
                  {isEtb && typeof w.destination === "object" ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white font-medium">
                          {w.destination.accountName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[11px] text-white">{w.destination.accountNumber}</span>
                        <CopyButton text={w.destination.accountNumber} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[11px] text-white break-all leading-relaxed">
                        {dest}
                      </span>
                      {dest && <CopyButton text={dest} />}
                    </div>
                  )}
                </div>

                {/* Fee Row */}
                {w.fee > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#848e9c]">Network Fee</span>
                    <span className="text-white">{w.fee} {w.coin}</span>
                  </div>
                )}

                {/* Date */}
                <div className="flex justify-between text-[10px] text-[#848e9c]">
                  <span>Requested</span>
                  <span>{new Date(w.createdAt).toLocaleString()}</span>
                </div>

                {msg?.id === w.id && (
                  <p className={`text-xs text-center ${msg.ok ? "text-green-400" : "text-red-400"}`}>
                    {msg.text}
                  </p>
                )}

                {/* Action Buttons - only for pending non-internal */}
                {w.status === "pending" && !isInternal && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAction(w.id, "reject")}
                      disabled={!!actionLoading}
                      className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {actionLoading === w.id + "reject" ? "..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleAction(w.id, "approve")}
                      disabled={!!actionLoading}
                      className="flex-1 rounded-xl bg-green-500 py-2 text-xs font-bold text-[#0b0e11] transition hover:bg-green-600 disabled:opacity-50"
                    >
                      {actionLoading === w.id + "approve" ? "..." : "Approve"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
