"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiUser, FiInfo, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";

export default function InternalTransferPage() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { fundingWallets } = useFirestoreAssetsData();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const usdtWallet = fundingWallets.find(w => w.coin === "USDT");
  const maxBalance = usdtWallet?.balance ?? 0;

  const handleSubmit = async () => {
    if (!recipient || !amount) { setError("Please fill all fields"); return; }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { setError("Enter a valid amount"); return; }
    if (numAmount > maxBalance) { setError("Insufficient balance"); return; }

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
          type: "internal_transfer",
          coin: "USDT",
          amount: numAmount,
          destination: recipient,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transfer failed");
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
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
          <FiCheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transfer Successful</h2>
        <p className="text-[#848e9c] mb-8 text-center">Your funds have been instantly transferred to <span className="text-white font-medium">{recipient}</span>.</p>
        <button
          onClick={() => router.push("/profile/funding")}
          className="w-full max-w-sm bg-white/[0.08] hover:bg-white/[0.12] rounded-xl py-3.5 text-sm font-bold transition"
        >
          Return to Funding
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11] px-4 py-4 flex items-center gap-4 border-b border-white/[0.04]">
        <button onClick={() => router.back()} className="text-white">
          <FiArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Internal Transfer</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <div className="flex items-center gap-3 text-xs text-[#848e9c] mb-3">
            <FiUser size={16} />
            <span>Payee Account</span>
          </div>
          <input
            type="text"
            placeholder="Email / Korixa UID"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-[#3b4351]"
          />
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <div className="flex justify-between text-xs text-[#848e9c] mb-3">
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
              onClick={() => setAmount(maxBalance.toString())}
              className="text-[10px] font-bold text-primary ml-2 bg-primary/10 px-2 py-1 rounded shrink-0"
            >
              MAX
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <div className="bg-blue-500/10 p-4 rounded-xl flex gap-3 text-blue-400 text-xs border border-blue-500/20">
          <FiInfo className="shrink-0 mt-0.5" size={16} />
          <p>Internal transfers are instant and incur 0 fees. The amount will be deducted from your Funding Wallet and credited to the receiver&apos;s Funding Wallet.</p>
        </div>

        <div className="bg-white/[0.02] rounded-xl p-4 flex justify-between text-xs">
          <span className="text-[#848e9c]">Network Fee</span>
          <span className="text-green-400 font-bold">0 USDT</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !amount || !recipient}
          className="w-full bg-primary hover:bg-primary/90 text-[#0b0e11] font-bold text-sm rounded-2xl py-3.5 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm Transfer"}
        </button>
      </div>
    </div>
  );
}
