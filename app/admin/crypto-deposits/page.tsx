"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiX, FiImage, FiClock, FiCheckCircle, FiXCircle, FiUser } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CryptoDepositsAdmin() {
  const { getIdToken } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/crypto-deposits?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDeposits(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDeposits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, [statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject", currentAmount: number) => {
    if (!confirm(`Are you sure you want to ${action} this deposit?`)) return;

    let amount = currentAmount;
    if (action === "approve") {
      const promptAmount = prompt("Confirm amount to credit (USDT):", currentAmount.toString());
      if (promptAmount === null) return;
      const parsed = Number(promptAmount);
      if (isNaN(parsed) || parsed <= 0) return alert("Invalid amount");
      amount = parsed;
    }

    setProcessingId(id);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/crypto-deposits/action", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action, amount }),
      });
      if (res.ok) {
        fetchDeposits();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing deposit");
    } finally {
      setProcessingId(null);
    }
  };

  const statusConfig: Record<string, { label: string; icon: typeof FiClock; color: string; bg: string }> = {
    pending: { label: "Pending", icon: FiClock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    approved: { label: "Approved", icon: FiCheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    rejected: { label: "Rejected", icon: FiXCircle, color: "text-red-500", bg: "bg-red-500/10" },
  };

  return (
    <div className="mx-auto max-w-lg pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Crypto Deposits</h1>
        <p className="text-xs text-[#848e9c] mt-0.5">Manual verification queue</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 bg-[#0b0e11] rounded-xl p-1 border border-white/[0.06]">
        {["pending", "approved", "rejected"].map(s => {
          const cfg = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold capitalize transition ${
                statusFilter === s ? `${cfg.bg} ${cfg.color}` : "text-[#848e9c] hover:text-white"
              }`}
            >
              <Icon size={12} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      ) : deposits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a1e] p-12 text-center">
          <FiClock size={36} className="mx-auto text-[#2b3139] mb-3" />
          <p className="text-sm font-medium text-white">No {statusFilter} deposits</p>
          <p className="text-xs text-[#848e9c] mt-1">
            {statusFilter === "pending" ? "Users submitting screenshots will appear here" : `No ${statusFilter} records found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {deposits.map(d => {
            const cfg = statusConfig[d.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={d.id} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
                {/* Status bar */}
                <div className={`h-1 w-full ${d.status === "approved" ? "bg-green-500" : d.status === "rejected" ? "bg-red-500" : "bg-yellow-500"}`} />

                <div className="p-4">
                  {/* Top: user + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <FiUser size={14} className="text-[#848e9c]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate max-w-[160px]">{d.userEmail || "Unknown user"}</p>
                        <p className="text-[10px] text-[#848e9c]">{new Date(d.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.bg} ${cfg.color} shrink-0`}>
                      <Icon size={11} />
                      {d.status}
                    </div>
                  </div>

                  {/* Amount + Network */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 rounded-xl bg-[#0b0e11] p-3">
                      <p className="text-[10px] text-[#848e9c] mb-0.5">Amount</p>
                      <p className="text-base font-bold text-green-500">{d.amount} <span className="text-xs font-normal text-[#848e9c]">{d.coin || "USDT"}</span></p>
                    </div>
                    <div className="flex-1 rounded-xl bg-[#0b0e11] p-3">
                      <p className="text-[10px] text-[#848e9c] mb-0.5">Network</p>
                      <p className="text-sm font-bold text-white">{d.networkName || "—"}</p>
                    </div>
                  </div>

                  {/* Screenshot preview */}
                  {d.screenshotUrl && (
                    <button
                      onClick={() => setSelectedImage(d.screenshotUrl)}
                      className="w-full mb-3 overflow-hidden rounded-xl border border-white/10 bg-[#0b0e11] relative group"
                    >
                      <img
                        src={d.screenshotUrl}
                        alt="Payment proof"
                        className="w-full h-32 object-cover group-hover:opacity-90 transition"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs text-white font-medium backdrop-blur-sm">
                          <FiImage size={14} />
                          View Full
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Actions */}
                  {d.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        disabled={processingId === d.id}
                        onClick={() => handleAction(d.id, "approve", d.amount)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500/10 py-2.5 text-xs font-bold text-green-500 hover:bg-green-500 hover:text-white transition disabled:opacity-50"
                      >
                        <FiCheck size={14} />
                        Approve & Credit
                      </button>
                      <button
                        disabled={processingId === d.id}
                        onClick={() => handleAction(d.id, "reject", d.amount)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                      >
                        <FiX size={14} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <FiX size={18} />
            </button>
            <img src={selectedImage} alt="Payment Proof" className="w-full rounded-2xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
