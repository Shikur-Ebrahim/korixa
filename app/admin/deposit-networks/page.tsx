"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiToggleLeft, FiToggleRight, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DepositNetworksAdmin() {
  const { getIdToken } = useAuth();
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [minDeposit, setMinDeposit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchNetworks = async () => {
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/deposit-networks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNetworks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNetworks(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !network || !address || !minDeposit) return alert("Fill all fields");
    setSubmitting(true);
    const token = await getIdToken();
    const res = await fetch("/api/admin/deposit-networks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, symbol: "USDT", network, address, minDeposit }),
    });
    if (res.ok) {
      setName(""); setNetwork(""); setAddress(""); setMinDeposit("");
      setShowForm(false);
      fetchNetworks();
    } else {
      alert("Failed to add network");
    }
    setSubmitting(false);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const token = await getIdToken();
    await fetch("/api/admin/deposit-networks", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, isActive: !currentStatus }),
    });
    fetchNetworks();
  };

  const deleteNetwork = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = await getIdToken();
    const res = await fetch("/api/admin/deposit-networks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchNetworks();
    else alert("Failed to delete");
  };

  return (
    <div className="mx-auto max-w-lg px-0 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">Deposit Networks</h1>
          <p className="text-xs text-[#848e9c] mt-0.5">{networks.length} network{networks.length !== 1 ? "s" : ""} configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${showForm ? "bg-white/10 text-white" : "bg-primary text-[#0b0e11]"}`}
        >
          <FiPlus size={16} />
          {showForm ? "Cancel" : "Add Network"}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-[#161a1e] p-5">
          <h2 className="text-sm font-bold text-white mb-4">New Network</h2>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c] font-medium">Chain Name</label>
              <input
                type="text"
                placeholder="e.g. TRON (TRC20)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 text-sm text-white focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c] font-medium">Network Code</label>
              <input
                type="text"
                placeholder="e.g. TRC20"
                value={network}
                onChange={e => setNetwork(e.target.value)}
                className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 text-sm text-white focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c] font-medium">Wallet Address</label>
              <input
                type="text"
                placeholder="Paste your wallet address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 text-sm text-white font-mono focus:border-primary outline-none transition"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c] font-medium">Min Deposit (USDT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 10"
                value={minDeposit}
                onChange={e => setMinDeposit(e.target.value)}
                className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 text-sm text-white focus:border-primary outline-none transition"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {submitting ? "Saving..." : "Save Network"}
            </button>
          </form>
        </div>
      )}

      {/* Networks List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : networks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#161a1e] p-10 text-center">
          <FiAlertTriangle size={32} className="mx-auto text-[#848e9c] mb-3" />
          <p className="text-sm font-medium text-white">No networks yet</p>
          <p className="text-xs text-[#848e9c] mt-1">Click "Add Network" to create your first deposit chain</p>
        </div>
      ) : (
        <div className="space-y-3">
          {networks.map(n => (
            <div key={n.id} className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4">
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{n.name}</span>
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#848e9c]">{n.network}</span>
                  </div>
                  <p className="text-xs text-[#848e9c]">Min: <span className="text-white font-medium">{n.minDeposit} USDT</span></p>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${n.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                  {n.isActive ? <FiCheckCircle size={11} /> : <FiXCircle size={11} />}
                  {n.isActive ? "Active" : "Disabled"}
                </div>
              </div>

              {/* Address */}
              <div className="rounded-xl bg-[#0b0e11] px-3 py-2 mb-3">
                <p className="text-[10px] text-[#848e9c] mb-0.5">Wallet Address</p>
                <p className="text-xs text-white font-mono truncate">{n.address}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(n.id, n.isActive)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                    n.isActive
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  }`}
                >
                  {n.isActive ? <FiToggleLeft size={14} /> : <FiToggleRight size={14} />}
                  {n.isActive ? "Disable" : "Enable"}
                </button>
                <button
                  onClick={() => deleteNetwork(n.id, n.name)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition"
                >
                  <FiTrash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
