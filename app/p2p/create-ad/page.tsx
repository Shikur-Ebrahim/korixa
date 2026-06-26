"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { FiArrowLeft, FiCheckCircle, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { PaymentMethod } from "@/lib/p2p/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

const TIME_LIMITS = [15, 30, 45, 60];

export default function CreateAdPage() {
  const router = useRouter();
  const { user, kycStatus, getIdToken } = useAuth();
  const isVerified = kycStatus === "verified";
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  // Admin bypass flag
  const [isAdmin, setIsAdmin] = useState(false);

  // Form State
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxOrder, setMaxOrder] = useState("");
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [terms, setTerms] = useState("");
  const [autoReply, setAutoReply] = useState("");

  useEffect(() => {
    // Determine admin status
    getIdToken().then((token) => {
      if (!token) return;
      const checkAdmin = async () => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role === "admin") setIsAdmin(true);
        } catch (e) {}
      };
      checkAdmin();
    });
  }, [getIdToken]);

  useEffect(() => {
    if (kycStatus && kycStatus !== "verified") {
      router.replace("/p2p");
    }
  }, [kycStatus, router]);

  if (!isVerified) return <div className="p-8 text-center text-white text-xs">Checking KYC...</div>;

  const handleNext = () => {
    if (!price || !amount || !minOrder || !maxOrder || selectedMethods.length === 0) {
      return alert("Please fill all required fields and select at least one payment method.");
    }
    if (Number(minOrder) > Number(maxOrder)) {
      return alert("Minimum order cannot be greater than maximum order.");
    }
    setStep(2);
  };

  const handlePublish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const db = getClientFirestore();
      const adRef = doc(collection(db, "p2pAdvertisements"));
      
      const priceNum = Number(price);
      const amountNum = Number(amount);
      const minNum = Number(minOrder);
      const maxNum = Number(maxOrder);

      await setDoc(adRef, {
        merchantId: user.uid,
        merchantName: user.email?.split("@")[0] ?? "User",
        merchantVerified: true,
        merchantCompletionRate: 100,
        merchantTotalOrders: 0,
        type, 
        currency: "ETB",
        price: priceNum,
        availableUSDT: amountNum,
        minOrderLimit: minNum,
        maxOrderLimit: maxNum,
        paymentMethods: selectedMethods,
        paymentAccountDetails: [], 
        termsOfTrade: terms,
        autoReply: autoReply,
        timeLimit: timeLimit,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      
      router.push("/p2p/my-ads");
    } catch (e: any) {
      console.error(e);
      alert("Failed to create advertisement: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMethod = (m: PaymentMethod) => {
    if (selectedMethods.includes(m)) {
      setSelectedMethods(selectedMethods.filter(x => x !== m));
    } else {
      setSelectedMethods([...selectedMethods, m]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
        <button
          onClick={() => step === 2 ? setStep(1) : router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
        >
          <FiArrowLeft size={16} />
        </button>
        <h1 className="text-sm font-bold">
          {step === 1 ? "Create Advertisement" : "Preview Advertisement"}
        </h1>
      </header>

      <main className="p-4 space-y-6 pb-24">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {/* Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">I want to...</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("buy")}
                  className={`flex-1 rounded-xl py-3 text-xs font-bold transition ${
                    type === "buy" ? "bg-green-500 text-[#0b0e11]" : "bg-[#1e2329] text-[#848e9c]"
                  }`}
                >
                  Buy USDT
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setType("sell")}
                    className={`flex-1 rounded-xl py-3 text-xs font-bold transition ${
                      type === "sell" ? "bg-red-500 text-[#0b0e11]" : "bg-[#1e2329] text-[#848e9c]"
                    }`}
                  >
                    Sell USDT
                  </button>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Price (ETB per USDT)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 115.50"
                className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-sm font-bold text-white placeholder:text-[#848e9c] placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Total Amount (USDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-sm font-bold text-white placeholder:text-[#848e9c] placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#848e9c]">Min Order (ETB)</label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-sm font-bold text-white placeholder:text-[#848e9c] placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#848e9c]">Max Order (ETB)</label>
                <input
                  type="number"
                  value={maxOrder}
                  onChange={(e) => setMaxOrder(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-sm font-bold text-white placeholder:text-[#848e9c] placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Payment Methods</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMethod(m)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                      selectedMethods.includes(m)
                        ? "bg-primary/20 text-primary border border-primary/50"
                        : "bg-[#1e2329] text-[#848e9c] border border-transparent"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Payment Time Limit</label>
              <div className="flex gap-2">
                {TIME_LIMITS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeLimit(t)}
                    className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition ${
                      timeLimit === t
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "bg-[#1e2329] text-[#848e9c] border border-transparent"
                    }`}
                  >
                    {t} min
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Terms of Trade (Optional)</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Write your terms here..."
                rows={3}
                className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-xs text-white placeholder:text-[#848e9c] focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            {/* Auto Reply */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#848e9c]">Auto Reply (Optional)</label>
              <textarea
                value={autoReply}
                onChange={(e) => setAutoReply(e.target.value)}
                placeholder="Auto reply message sent when order is created..."
                rows={2}
                className="w-full rounded-xl bg-[#1e2329] px-4 py-3 text-xs text-white placeholder:text-[#848e9c] focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            
            <button
              onClick={handleNext}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] hover:bg-primary/90 transition shadow-lg shadow-primary/20 mt-4"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-[#848e9c]">Ad Type</span>
                <span className={`text-xs font-bold ${type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  {type === 'buy' ? "BUY USDT" : "SELL USDT"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-[#848e9c]">Price</span>
                <span className="text-sm font-bold text-white">{price} ETB</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-[#848e9c]">Total Amount</span>
                <span className="text-sm font-bold text-white">{amount} USDT</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-[#848e9c]">Order Limit</span>
                <span className="text-xs font-bold text-white">{minOrder} - {maxOrder} ETB</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <span className="text-xs font-bold text-[#848e9c]">Payment Methods</span>
                <span className="text-xs font-medium text-white text-right max-w-[60%]">
                  {selectedMethods.join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-[#848e9c]">Time Limit</span>
                <span className="text-xs font-bold text-white">{timeLimit} Minutes</span>
              </div>
            </div>

            <button
              onClick={handlePublish}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? "Publishing..." : "Publish Advertisement"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
