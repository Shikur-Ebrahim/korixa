"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiInfo, FiCheckSquare, FiX } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";

export default function OnchainWithdrawPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { fundingWallets } = useFirestoreAssetsData();
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [showNetworkModal, setShowNetworkModal] = useState(false);
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
        <p className="text-[#848e9c] mb-8 text-center">Your withdrawal request is pending system verification. It will be processed shortly.</p>
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <p className="text-xs text-[#848e9c] mb-2">Address</p>
          <input
            type="text"
            placeholder="Long press to paste"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-[#3b4351]"
          />
        </div>

        <div 
          className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04] cursor-pointer"
          onClick={() => setShowNetworkModal(true)}
        >
          <p className="text-xs text-[#848e9c] mb-2">Network</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">
              {network === "TRC20" ? "Tron (TRC20)" : network === "ERC20" ? "Ethereum (ERC20)" : "BNB Smart Chain (BEP20)"}
            </span>
            <span className="text-[#848e9c]">▼</span>
          </div>
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <div className="flex justify-between text-xs text-[#848e9c] mb-2">
            <span>Withdrawal Amount</span>
            <span>Avail: <span className="text-white font-medium">{maxBalance.toFixed(2)} USDT</span></span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-[#3b4351]"
            />
            <span className="text-sm font-bold text-white shrink-0">USDT</span>
            <button 
              onClick={() => setAmount(Math.max(0, maxBalance - fee).toString())}
              className="text-[10px] font-bold text-primary ml-2 bg-primary/10 px-2 py-1 rounded shrink-0"
            >
              MAX
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="bg-white/[0.02] p-4 rounded-xl space-y-2 text-xs text-[#848e9c]">
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
          className="w-full bg-primary hover:bg-primary/90 text-[#0b0e11] font-bold text-sm rounded-2xl py-3.5 mt-4 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </div>

      {/* Network Selection Modal */}
      {showNetworkModal && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setShowNetworkModal(false)}
        >
          <div 
            className="animate-slide-up w-full rounded-t-3xl bg-[#161a1e] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Select Network</h2>
              <button onClick={() => setShowNetworkModal(false)} className="p-1 text-[#848e9c] hover:text-white transition">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { id: "TRC20", name: "Tron (TRC20)" },
                { id: "ERC20", name: "Ethereum (ERC20)" },
                { id: "BEP20", name: "BNB Smart Chain (BEP20)" },
              ].map((net) => (
                <button
                  key={net.id}
                  onClick={() => { setNetwork(net.id); setShowNetworkModal(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${network === net.id ? "border-primary bg-primary/5" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"} transition text-left`}
                >
                  <span className={`text-sm font-semibold ${network === net.id ? "text-primary" : "text-white"}`}>{net.name}</span>
                  {network === net.id && <FiCheckSquare className="text-primary" size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
