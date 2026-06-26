"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiInfo, FiCheckSquare } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";

export default function OnchainWithdrawPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { fundingWallets } = useFirestoreAssetsData();
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const usdtWallet = fundingWallets.find(w => w.coin === "USDT");
  const maxBalance = usdtWallet?.balance ?? 0;
  const fee = 1.00; // Fixed fee for on-chain withdrawal

  const handleSubmit = async () => {
    if (!address || !amount) {
      setError("Please fill all fields");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (numAmount + fee > maxBalance) {
      setError("Insufficient balance including fee");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = await getIdToken();
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "crypto_onchain",
          coin: "USDT",
          amount: numAmount,
          fee: fee,
          destination: address,
          network: network
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Withdrawal failed");

      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <FiCheckSquare size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
        <p className="text-[#848e9c] mb-8 text-center">Your withdrawal request is pending admin verification. It will be processed shortly.</p>
        <button 
          onClick={() => router.push("/profile/history")}
          className="w-full bg-white/[0.08] hover:bg-white/[0.12] rounded-xl py-4 font-bold transition"
        >
          View History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="sticky top-0 z-40 bg-[#0b0e11] px-4 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white">
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Withdraw On-Chain</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <p className="text-sm text-[#848e9c] mb-2">Address</p>
          <input
            type="text"
            placeholder="Long press to paste"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-transparent text-white font-medium outline-none placeholder-[#3b4351]"
          />
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <p className="text-sm text-[#848e9c] mb-2">Network</p>
          <select 
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full bg-transparent text-white font-bold outline-none appearance-none"
          >
            <option value="TRC20" className="bg-[#161a1e]">Tron (TRC20)</option>
            <option value="ERC20" className="bg-[#161a1e]">Ethereum (ERC20)</option>
            <option value="BEP20" className="bg-[#161a1e]">BNB Smart Chain (BEP20)</option>
          </select>
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <div className="flex justify-between text-sm text-[#848e9c] mb-2">
            <span>Withdrawal Amount</span>
            <span>Avail: {maxBalance.toFixed(2)} USDT</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-[#3b4351]"
            />
            <span className="text-lg font-bold text-white">USDT</span>
            <button 
              onClick={() => setAmount(Math.max(0, maxBalance - fee).toString())}
              className="text-xs font-bold text-primary ml-2 bg-primary/10 px-2 py-1 rounded"
            >
              MAX
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="bg-white/[0.02] p-4 rounded-xl space-y-2 text-sm text-[#848e9c]">
          <div className="flex justify-between">
            <span>Network fee</span>
            <span className="text-white">{fee.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Receive Amount</span>
            <span className="text-white">{Math.max(0, parseFloat(amount || "0") - fee).toFixed(2)} USDT</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !amount || !address}
          className="w-full bg-primary hover:bg-primary/90 text-[#0b0e11] font-bold text-lg rounded-2xl py-4 mt-6 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>
    </div>
  );
}
