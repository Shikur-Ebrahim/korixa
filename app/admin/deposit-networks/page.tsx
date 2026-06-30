"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiPower, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

export default function DepositNetworksAdmin() {
  const { getIdToken } = useAuth();
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("USDT");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [minDeposit, setMinDeposit] = useState("");

  const fetchNetworks = async () => {
    try {
      const res = await fetch("/api/admin/deposit-networks");
      const data = await res.json();
      setNetworks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !network || !address || !minDeposit) return alert("Fill all fields");

    const token = await getIdToken();
    const res = await fetch("/api/admin/deposit-networks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, symbol, network, address, minDeposit }),
    });

    if (res.ok) {
      alert("Network added!");
      setName("");
      setNetwork("");
      setAddress("");
      setMinDeposit("");
      fetchNetworks();
    } else {
      alert("Failed to add network");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const token = await getIdToken();
    const res = await fetch("/api/admin/deposit-networks", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, isActive: !currentStatus }),
    });
    if (res.ok) fetchNetworks();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Deposit Networks</h1>
      </div>

      {/* Add Network Form */}
      <div className="rounded-xl border border-white/10 bg-[#161a1e] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Add New Network</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Chain Name</label>
              <input
                type="text"
                placeholder="e.g. TRON (TRC20)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-[#0b0e11] border border-white/10 p-2 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Network Code</label>
              <input
                type="text"
                placeholder="e.g. TRC20"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full rounded-lg bg-[#0b0e11] border border-white/10 p-2 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Wallet Address</label>
              <input
                type="text"
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg bg-[#0b0e11] border border-white/10 p-2 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Min Deposit (USDT)</label>
              <input
                type="number"
                step="0.01"
                placeholder="10"
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                className="w-full rounded-lg bg-[#0b0e11] border border-white/10 p-2 text-sm text-white focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-[#0b0e11] hover:bg-primary/90"
              >
                Add Network
              </button>
            </div>
          </form>
        </div>

        {/* Network List */}
        <div className="rounded-xl border border-white/10 bg-[#161a1e] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#848e9c]">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="bg-white/[0.02] text-xs text-[#848e9c]">
                  <tr>
                    <th className="p-4 font-medium">Network</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium">Wallet Address</th>
                    <th className="p-4 font-medium">Min Deposit</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {networks.map((n) => (
                    <tr key={n.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-medium">{n.name}</td>
                      <td className="p-4"><span className="rounded bg-white/10 px-2 py-0.5 text-xs">{n.network}</span></td>
                      <td className="p-4 text-xs text-[#848e9c] break-all max-w-[200px]">{n.address}</td>
                      <td className="p-4">{n.minDeposit} {n.symbol}</td>
                      <td className="p-4">
                        {n.isActive ? (
                          <span className="flex items-center gap-1 text-green-500"><FiCheckCircle size={14}/> Active</span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500"><FiXCircle size={14}/> Disabled</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleStatus(n.id, n.isActive)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${n.isActive ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-green-500/10 text-green-500 hover:bg-green-500/20"}`}
                        >
                          {n.isActive ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {networks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#848e9c]">No networks configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
