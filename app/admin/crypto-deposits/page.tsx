"use client";

import { useState, useEffect } from "react";
import { FiCheck, FiX, FiExternalLink, FiImage, FiClock } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

export default function CryptoDepositsAdmin() {
  const { getIdToken } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch(`/api/admin/crypto-deposits?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDeposits(data);
      } else {
        console.error("API Error:", data);
        setDeposits([]);
        alert(data.error || "Failed to load deposits");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject", currentAmount: number) => {
    if (!confirm(`Are you sure you want to ${action} this deposit?`)) return;

    let amount = currentAmount;
    if (action === "approve") {
      const promptAmount = prompt("Confirm amount to credit (USDT):", currentAmount.toString());
      if (promptAmount === null) return; // Cancelled
      const parsed = Number(promptAmount);
      if (isNaN(parsed) || parsed <= 0) return alert("Invalid amount");
      amount = parsed;
    }

    setProcessingId(id);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/crypto-deposits/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Manual Crypto Deposits</h1>
          
          <div className="flex bg-[#161a1e] rounded-lg p-1 border border-white/10">
            {["pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition ${
                  statusFilter === s 
                    ? "bg-[#2b3139] text-white shadow" 
                    : "text-[#848e9c] hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#161a1e] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#848e9c]">Loading...</div>
          ) : deposits.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <FiClock size={48} className="text-[#2b3139] mb-4" />
              <div className="text-white font-medium">No {statusFilter} deposits found</div>
              <div className="text-sm text-[#848e9c] mt-1">Users submitting screenshots will appear here.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/[0.02] text-xs text-[#848e9c]">
                  <tr>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Network</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">TXID</th>
                    <th className="p-4 font-medium text-center">Proof</th>
                    {statusFilter === "pending" && <th className="p-4 font-medium text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-[#848e9c] whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">{d.userEmail || "Unknown"}</div>
                        <div className="text-[10px] text-[#848e9c]">{d.userId}</div>
                      </td>
                      <td className="p-4">
                        <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{d.networkName}</span>
                      </td>
                      <td className="p-4 font-bold text-green-500">
                        {d.amount} {d.coin}
                      </td>
                      <td className="p-4">
                        {d.txId ? (
                          <div className="text-xs text-[#848e9c] max-w-[150px] truncate" title={d.txId}>{d.txId}</div>
                        ) : (
                          <span className="text-xs text-[#848e9c] italic">Not provided</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedImage(d.screenshotUrl)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2b3139] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3b4149] transition"
                        >
                          <FiImage /> View
                        </button>
                      </td>
                      {statusFilter === "pending" && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              disabled={processingId === d.id}
                              onClick={() => handleAction(d.id, "approve", d.amount)}
                              className="flex items-center justify-center h-8 w-8 rounded bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition disabled:opacity-50"
                              title="Approve & Credit"
                            >
                              <FiCheck size={16} />
                            </button>
                            <button
                              disabled={processingId === d.id}
                              onClick={() => handleAction(d.id, "reject", d.amount)}
                              className="flex items-center justify-center h-8 w-8 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
                              title="Reject"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[90vh] max-w-3xl rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition"
            >
              <FiX size={20} />
            </button>
            <img src={selectedImage} alt="Payment Proof" className="max-h-[90vh] object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
