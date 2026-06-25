"use client";

import { useEffect, useState } from "react";
import { FiDollarSign, FiRefreshCw, FiAlertTriangle, FiArrowUpRight, FiHardDrive } from "react-icons/fi";
import { formatUsd } from "@/lib/format";

type WalletAddress = {
  uid: string;
  address: string;
  balance: number;
  lastDepositAt: string;
};

export default function AdminWalletPage() {
  const [data, setData] = useState<{ totalUsdt: number; addresses: WalletAddress[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sweepingAddress, setSweepingAddress] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    fetch("/api/admin/wallet")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSweep = (address: string) => {
    setSweepingAddress(address);
    // In a real app, this would call an API that uses the stored privateKey
    // to send the USDT to a master address, AFTER checking if it has enough TRX for gas.
    setTimeout(() => {
      alert("Sweeping requires ~15-30 TRX for gas fees per address. Please ensure the user address is funded with TRX before sweeping.");
      setSweepingAddress(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Platform Wallet</h1>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <FiDollarSign size={20} />
            </div>
            <h2 className="text-sm font-semibold text-[#848e9c]">Total Real USDT Collected</h2>
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? "..." : formatUsd(data?.totalUsdt || 0)}
          </p>
          <p className="mt-1 text-xs text-[#848e9c]">Across all user deposit addresses</p>
        </div>

        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 text-yellow-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-yellow-500 mb-1">Withdrawal Note (Gas Fees)</h3>
              <p className="text-xs text-yellow-500/80 leading-relaxed">
                To withdraw USDT from these automatically generated user addresses, the TRON network requires TRX for gas. You must manually fund an address with ~15-30 TRX before attempting a sweep to the master wallet.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
        <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
          <h3 className="font-semibold text-white">User Deposit Addresses</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#848e9c]">
                <th className="px-6 py-4 font-medium">User ID</th>
                <th className="px-6 py-4 font-medium">TRC20 Address</th>
                <th className="px-6 py-4 font-medium">Current Balance</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#848e9c]">Loading addresses...</td>
                </tr>
              ) : data?.addresses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#848e9c]">No active deposit addresses found.</td>
                </tr>
              ) : (
                data?.addresses.map((addr) => (
                  <tr key={addr.address} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4 text-white">
                      <span className="font-mono text-xs">{addr.uid.slice(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiHardDrive className="text-[#848e9c]" size={14} />
                        <span className="font-mono text-xs text-[#848e9c]">{addr.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {formatUsd(addr.balance)} USDT
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSweep(addr.address)}
                        disabled={sweepingAddress === addr.address || addr.balance === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiArrowUpRight size={14} />
                        {sweepingAddress === addr.address ? "Sweeping..." : "Sweep to Master"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
