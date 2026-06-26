"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft, FiDollarSign, FiCheck, FiPlus, FiX, FiAlertTriangle, FiChevronRight,
} from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { PaymentMethod, PaymentAccountDetail } from "@/lib/p2p/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr", "CBE", "Awash Bank", "Dashen Bank", "Bank of Abyssinia",
];

const METHOD_ICONS: Record<string, string> = {
  "Telebirr": "📱",
  "CBE": "🏦",
  "Awash Bank": "🏛️",
  "Dashen Bank": "🏦",
  "Bank of Abyssinia": "🏛️",
};

type Step = "price" | "limits" | "payment" | "confirm";

export default function CreateAdPage() {
  const router = useRouter();
  const { user, kycStatus } = useAuth();
  const isVerified = kycStatus === "verified";

  const [step, setStep] = useState<Step>("price");
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form fields
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [minLimit, setMinLimit] = useState("");
  const [maxLimit, setMaxLimit] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      const db = getClientFirestore();
      const q = query(collection(db, "wallets"), where("userId", "==", user.uid), where("coin", "==", "USDT"), where("type", "==", "funding"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setUsdtBalance(data.availableBalance ?? 0);
        setWalletId(snap.docs[0].id);
      }
    };
    fetchWallet();
  }, [user]);

  const toggleMethod = (m: PaymentMethod) => {
    setSelectedMethods(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = async () => {
    if (!user || !walletId) return;
    const priceNum = parseFloat(price);
    const amountNum = parseFloat(amount);
    const minNum = parseFloat(minLimit);
    const maxNum = parseFloat(maxLimit);

    if (!priceNum || !amountNum || !minNum || !maxNum) { showToast("Please fill all fields."); return; }
    if (amountNum <= 0) { showToast("Amount must be greater than 0."); return; }
    if (minNum >= maxNum) { showToast("Min limit must be less than max limit."); return; }
    if (selectedMethods.length === 0) { showToast("Select at least one payment method."); return; }

    setSubmitting(true);
    try {
      const db = getClientFirestore();

      // Create the advertisement (BUY AD)
      await addDoc(collection(db, "p2pAdvertisements"), {
        type: "buy",
        merchantId: user.uid,
        merchantName: user.displayName || user.email?.split("@")[0] || "Seller",
        merchantVerified: true,
        merchantTotalOrders: 0,
        merchantCompletionRate: 100,
        price: priceNum,
        availableUSDT: amountNum,
        minOrderLimit: minNum,
        maxOrderLimit: maxNum,
        paymentMethods: selectedMethods,
        paymentAccountDetails: [],
        status: "active",
        currency: "ETB",
        createdAt: new Date().toISOString(),
      });

      router.push("/p2p");
    } catch (e) {
      console.error(e);
      showToast("Failed to create ad. Please try again.");
      setSubmitting(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <FiAlertTriangle size={40} className="text-orange-400" />
        <h1 className="text-lg font-bold">KYC Required</h1>
        <p className="text-xs text-[#848e9c]">You must complete identity verification before creating a P2P ad.</p>
        <button onClick={() => router.push("/kyc?start=1")} className="mt-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-black">
          Verify Now
        </button>
      </div>
    );
  }

  const steps: Step[] = ["price", "limits", "payment", "confirm"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-2xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl" style={{ minWidth: 220, maxWidth: "90vw" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-[#0b0e11]/95 px-4 py-4 backdrop-blur-md">
        <button onClick={() => step === "price" ? router.back() : setStep(steps[stepIndex - 1])} className="text-[#848e9c] hover:text-white transition">
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold">Create Buy Ad</h1>
          <p className="text-[11px] text-[#848e9c]">Buy USDT — send ETB</p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= stepIndex ? "bg-primary w-5" : "bg-white/[0.1] w-3"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        {/* Balance display */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161a1e] px-4 py-3">
          <div className="flex items-center gap-2">
            <FiDollarSign size={14} className="text-primary" />
            <span className="text-xs text-[#848e9c]">Available USDT</span>
          </div>
          <span className="text-sm font-bold text-white">{usdtBalance.toFixed(4)} USDT</span>
        </div>

        {/* ── STEP 1: Price & Amount ── */}
        {step === "price" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#848e9c] uppercase tracking-wider">Price per USDT (ETB)</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-3">
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 57.5"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#848e9c] focus:outline-none"
                />
                <span className="text-xs font-bold text-[#848e9c]">ETB</span>
              </div>
              <p className="mt-1 text-[10px] text-[#848e9c]">Market rate: ~57 ETB per USDT</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#848e9c] uppercase tracking-wider">Total USDT to Buy</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-3">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#848e9c] focus:outline-none"
                />
              </div>
              {price && amount && (
                <p className="mt-1 text-[10px] text-green-400">
                  Total value: {(parseFloat(price) * parseFloat(amount)).toLocaleString()} ETB
                </p>
              )}
            </div>

            <button
              onClick={() => {
                if (!price || !amount) { showToast("Enter price and amount."); return; }
                if (parseFloat(amount) <= 0) { showToast("Amount must be greater than 0."); return; }
                setStep("limits");
              }}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-black transition hover:bg-primary/90"
            >
              Continue <FiChevronRight className="inline" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Order Limits ── */}
        {step === "limits" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#848e9c] uppercase tracking-wider">Minimum Order (ETB)</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-3">
                <input
                  type="number"
                  value={minLimit}
                  onChange={e => setMinLimit(e.target.value)}
                  placeholder="e.g. 500"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#848e9c] focus:outline-none"
                />
                <span className="text-xs font-bold text-[#848e9c]">ETB</span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#848e9c] uppercase tracking-wider">Maximum Order (ETB)</label>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-3">
                <input
                  type="number"
                  value={maxLimit}
                  onChange={e => setMaxLimit(e.target.value)}
                  placeholder="e.g. 5000"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#848e9c] focus:outline-none"
                />
                <span className="text-xs font-bold text-[#848e9c]">ETB</span>
              </div>
              {price && maxLimit && (
                <p className="mt-1 text-[10px] text-[#848e9c]">
                  Max ≈ {(parseFloat(maxLimit) / parseFloat(price)).toFixed(2)} USDT per order
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (!minLimit || !maxLimit) { showToast("Enter min and max limits."); return; }
                if (parseFloat(minLimit) >= parseFloat(maxLimit)) { showToast("Min must be less than max."); return; }
                setStep("payment");
              }}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-black transition hover:bg-primary/90"
            >
              Continue <FiChevronRight className="inline" />
            </button>
          </div>
        )}

        {/* ── STEP 3: Payment Methods ── */}
        {step === "payment" && (
          <div className="space-y-4">
            <p className="text-xs text-[#848e9c]">Select how you can send money to sellers.</p>

            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => {
                const selected = selectedMethods.includes(m);
                return (
                  <div key={m} className={`rounded-xl border transition ${selected ? "border-primary/50 bg-primary/5" : "border-white/[0.06] bg-[#161a1e]"}`}>
                    <button
                      onClick={() => toggleMethod(m)}
                      className="flex w-full items-center gap-3 px-4 py-3"
                    >
                      <span className="text-base">{METHOD_ICONS[m]}</span>
                      <span className="flex-1 text-left text-sm font-semibold text-white">{m}</span>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${selected ? "border-primary bg-primary" : "border-white/20 bg-transparent"}`}>
                        {selected && <FiCheck size={11} className="text-black" />}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (selectedMethods.length === 0) { showToast("Select at least one payment method."); return; }
                setStep("confirm");
              }}
              className="w-full rounded-xl bg-primary py-4 text-sm font-bold text-black transition hover:bg-primary/90"
            >
              Review Ad <FiChevronRight className="inline" />
            </button>
          </div>
        )}

        {/* ── STEP 4: Confirm ── */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <h2 className="text-sm font-bold text-white">Ad Summary</h2>
                <p className="text-[10px] text-[#848e9c]">Review before publishing</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[
                  { label: "Type", value: "Buy USDT → Send ETB" },
                  { label: "Price per USDT", value: `${parseFloat(price).toLocaleString()} ETB` },
                  { label: "USDT to buy", value: `${parseFloat(amount).toFixed(4)} USDT` },
                  { label: "Order limits", value: `${parseFloat(minLimit).toLocaleString()} – ${parseFloat(maxLimit).toLocaleString()} ETB` },
                  { label: "Payment methods", value: selectedMethods.join(", ") },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-3 text-xs">
                    <span className="text-[#848e9c]">{label}</span>
                    <span className="font-semibold text-white text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-green-500 py-4 text-sm font-bold text-white transition hover:bg-green-600 disabled:opacity-60"
            >
              {submitting ? "Publishing..." : "🚀 Publish Ad"}
            </button>
            <button
              onClick={() => setStep("payment")}
              className="w-full rounded-xl border border-white/[0.08] bg-transparent py-3 text-sm font-bold text-[#848e9c] transition hover:text-white"
            >
              Go Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
