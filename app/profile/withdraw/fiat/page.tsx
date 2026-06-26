"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiInfo, FiCheckSquare, FiX } from "react-icons/fi";
import { doc, getDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFirestoreAssetsData } from "@/hooks/useFirestoreAssetsData";

export default function FiatWithdrawPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { fundingWallets } = useFirestoreAssetsData();
  
  const [usdtAmount, setUsdtAmount] = useState("");
  const [bank, setBank] = useState("Commercial Bank of Ethiopia (CBE)");
  const [showBankModal, setShowBankModal] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  
  const ETHIOPIAN_BANKS = [
    "Commercial Bank of Ethiopia (CBE)",
    "Awash Bank",
    "Dashen Bank",
    "Bank of Abyssinia",
    "Wegagen Bank",
    "Cooperative Bank of Oromia",
    "Nib International Bank",
    "United Bank",
    "Zemen Bank",
    "Oromia International Bank"
  ];
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [etbRate, setEtbRate] = useState(175); // Default rate

  const usdtWallet = fundingWallets.find(w => w.coin === "USDT");
  const maxBalance = usdtWallet?.balance ?? 0;

  useEffect(() => {
    async function fetchRate() {
      try {
        const db = getClientFirestore();
        const docSnap = await getDoc(doc(db, "admin", "settings"));
        if (docSnap.exists() && docSnap.data().etbRate) {
          setEtbRate(docSnap.data().etbRate);
        }
      } catch (e) {
        console.error("Failed to fetch ETB rate", e);
      }
    }
    fetchRate();
  }, []);

  const handleSubmit = async () => {
    if (!usdtAmount || !accountName || !accountNumber) {
      setError("Please fill all fields");
      return;
    }
    const numAmount = parseFloat(usdtAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (numAmount > maxBalance) {
      setError("Insufficient balance");
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
          type: "fiat_etb",
          coin: "USDT",
          amount: numAmount,
          destination: {
            bank: bank,
            accountName,
            accountNumber
          },
          etbRate: etbRate
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

  const receiveEtb = (parseFloat(usdtAmount || "0") * etbRate).toFixed(2);

  if (success) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <FiCheckSquare size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
        <p className="text-[#848e9c] mb-8 text-center text-sm">Your fiat withdrawal request is pending admin verification. It will be processed shortly to your {bank} account.</p>
        <button 
          onClick={() => router.push("/profile/history")}
          className="w-full bg-white/[0.08] hover:bg-white/[0.12] rounded-xl py-3.5 text-sm font-bold transition max-w-sm"
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
        <h1 className="text-xl font-bold">Sell for ETB</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Exchange Rate Card */}
        <div className="bg-primary/10 rounded-xl p-4 flex items-center justify-between text-primary font-bold text-sm">
          <span>Current Rate</span>
          <span>1 USDT ≈ {etbRate} ETB</span>
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <div className="flex justify-between text-xs text-[#848e9c] mb-2">
            <span>Sell Amount (USDT)</span>
            <span>Avail: <span className="text-white font-medium">{maxBalance.toFixed(2)} USDT</span></span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={usdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white outline-none placeholder-[#3b4351]"
            />
            <span className="text-sm font-bold text-white shrink-0">USDT</span>
            <button 
              onClick={() => setUsdtAmount(maxBalance.toString())}
              className="text-[10px] font-bold text-primary ml-2 bg-primary/10 px-2 py-1 rounded shrink-0"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="flex justify-center my-1">
          <div className="h-6 w-6 rounded-full border border-white/[0.08] bg-[#0b0e11] flex items-center justify-center text-[#848e9c] text-xs">
            ↓
          </div>
        </div>

        <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
          <p className="text-xs text-[#848e9c] mb-2">Receive Amount (ETB)</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={receiveEtb}
              className="w-full bg-transparent text-xl font-bold text-white outline-none"
            />
            <span className="text-sm font-bold text-white shrink-0">ETB</span>
          </div>
        </div>

        {/* Bank Details */}
        <div className="space-y-4 pt-2">
          <h3 className="text-base font-bold text-white">Bank Details</h3>

          <div 
            className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04] cursor-pointer"
            onClick={() => setShowBankModal(true)}
          >
            <p className="text-xs text-[#848e9c] mb-2">Bank Name</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{bank}</span>
              <span className="text-[#848e9c]">▼</span>
            </div>
          </div>
          
          <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
            <p className="text-xs text-[#848e9c] mb-2">Account Holder Name</p>
            <input
              type="text"
              placeholder="John Doe"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-[#3b4351]"
            />
          </div>

          <div className="bg-[#161a1e] rounded-2xl p-4 border border-white/[0.04]">
            <p className="text-xs text-[#848e9c] mb-2">Account Number</p>
            <input
              type="text"
              placeholder="1000..."
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-transparent text-white text-sm font-medium outline-none placeholder-[#3b4351]"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !usdtAmount || !accountName || !accountNumber}
          className="w-full bg-primary hover:bg-primary/90 text-[#0b0e11] font-bold text-sm rounded-2xl py-3.5 mt-4 transition disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm Request"}
        </button>
      </div>

      {/* Bank Selection Modal */}
      {showBankModal && (
        <div 
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setShowBankModal(false)}
        >
          <div 
            className="animate-slide-up w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[#161a1e] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#161a1e] pt-1 pb-3">
              <h2 className="text-base font-bold text-white">Select Bank</h2>
              <button onClick={() => setShowBankModal(false)} className="p-1 text-[#848e9c] hover:text-white transition">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-2 pb-4">
              {ETHIOPIAN_BANKS.map((b) => (
                <button
                  key={b}
                  onClick={() => { setBank(b); setShowBankModal(false); }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border ${bank === b ? "border-primary bg-primary/5" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"} transition text-left`}
                >
                  <span className={`text-sm font-semibold ${bank === b ? "text-primary" : "text-white"}`}>{b}</span>
                  {bank === b && <FiCheckSquare className="text-primary" size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
