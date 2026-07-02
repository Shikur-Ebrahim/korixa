"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { P2PAdvertisement, P2POrder } from "@/lib/p2p/types";

export default function P2POrderCreationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  
  const action = params.action as "buy" | "sell";
  const adId = params.adId as string;

  const [ad, setAd] = useState<P2PAdvertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amountETB, setAmountETB] = useState("");
  const [amountUSDT, setAmountUSDT] = useState("");
  const [inputMode, setInputMode] = useState<"fiat" | "crypto">("fiat");

  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    async function fetchAd() {
      try {
        const adSnap = await getDoc(doc(getClientFirestore(), "p2pAdvertisements", adId));
        if (adSnap.exists()) {
          const data = { id: adSnap.id, ...adSnap.data() } as P2PAdvertisement;
          setAd(data);
          if (data.paymentMethods?.length > 0) {
            setSelectedMethod(data.paymentMethods[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [adId]);

  // Auto-calculation logic
  useEffect(() => {
    if (!ad) return;
    if (inputMode === "fiat" && amountETB) {
      const cryptoAmount = Number(amountETB) / ad.price;
      setAmountUSDT(cryptoAmount > 0 ? cryptoAmount.toFixed(4) : "");
    } else if (inputMode === "crypto" && amountUSDT) {
      const fiatAmount = Number(amountUSDT) * ad.price;
      setAmountETB(fiatAmount > 0 ? fiatAmount.toFixed(2) : "");
    } else {
      if (inputMode === "fiat") setAmountUSDT("");
      if (inputMode === "crypto") setAmountETB("");
    }
  }, [amountETB, amountUSDT, inputMode, ad]);

  const handleFiatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMode("fiat");
    setAmountETB(e.target.value);
  };

  const handleCryptoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMode("crypto");
    setAmountUSDT(e.target.value);
  };

  const handlePlaceOrder = async () => {
    if (!ad || !user || !amountETB || !amountUSDT) return;
    
    const etb = Number(amountETB);
    const usdt = Number(amountUSDT);

    if (etb < ad.minOrderLimit || etb > ad.maxOrderLimit) {
      alert(`Please enter an amount between ${ad.minOrderLimit} and ${ad.maxOrderLimit} ETB.`);
      return;
    }

    if (usdt > ad.availableUSDT) {
      alert(`Amount exceeds available balance of ${ad.availableUSDT} USDT.`);
      return;
    }

    if (!isBuy && (!selectedMethod || !accountName.trim() || !accountNumber.trim())) {
      alert("Please provide your payment account details so the merchant can send you ETB.");
      return;
    }

    setSubmitting(true);
    try {
      const orderData: Omit<P2POrder, "id"> = {
        adId: ad.id,
        merchantId: ad.merchantId,
        merchantName: ad.merchantName,
        buyerId: user.uid,
        type: action,
        amountUSDT: usdt,
        amountETB: etb,
        price: ad.price,
        paymentMethod: isBuy ? ad.paymentMethods[0] : (selectedMethod as any),
        paymentAccountDetails: isBuy 
          ? (ad.paymentAccountDetails ?? [])
          : [{ method: selectedMethod as any, accountName: accountName.trim(), accountNumber: accountNumber.trim() }],
        status: "pending",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
      };

      const docRef = await addDoc(collection(getClientFirestore(), "p2pOrders"), orderData);
      router.push(`/p2p/order/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b0e11] pt-24 text-center text-[#848e9c]">Loading ad details...</div>;
  if (!ad) return <div className="min-h-screen bg-[#0b0e11] pt-24 text-center text-red-500">Advertisement not found.</div>;

  const isBuy = action === "buy";

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/[0.06] bg-[#0b0e11]/95 px-4 py-4 backdrop-blur-md">
        <button onClick={() => router.back()} className="text-[#848e9c] transition hover:text-white">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">
          {isBuy ? "Buy USDT" : "Sell USDT"}
        </h1>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-6">
        {/* Merchant Card summary */}
        <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{ad.merchantName}</span>
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <div className="text-xs text-[#848e9c]">Price</div>
              <div className={`text-xl font-bold ${isBuy ? "text-green-500" : "text-red-500"}`}>
                {ad.price} ETB
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#848e9c]">Available</div>
              <div className="font-medium">{ad.availableUSDT} USDT</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-[#848e9c]">
            Limits: {ad.minOrderLimit} - {ad.maxOrderLimit} ETB
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          {/* I want to pay / I will receive */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
            <label className="text-xs font-medium text-[#848e9c]">
              {isBuy ? "I want to pay" : "I will receive"}
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={amountETB}
                onChange={handleFiatChange}
                placeholder={`Min ${ad.minOrderLimit}`}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
              />
              <span className="font-bold text-white">ETB</span>
            </div>
          </div>

          <div className="flex justify-center text-[#848e9c]">
            <FiRefreshCw size={16} />
          </div>

          {/* I will receive / I want to get */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
            <label className="text-xs font-medium text-[#848e9c]">
              {isBuy ? "I will receive" : "I will sell"}
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={amountUSDT}
                onChange={handleCryptoChange}
                placeholder="0.00"
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
              />
              <span className="font-bold text-white">USDT</span>
            </div>
          </div>
        </div>

        {/* Payment Details for Sell Orders */}
        {!isBuy && (
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4 space-y-4">
            <h3 className="text-sm font-bold text-white">Your Payment Details</h3>
            <p className="text-[11px] text-[#848e9c]">
              Select where you want the merchant to send the ETB.
            </p>
            
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Select Method</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-[#0b0e11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                {ad.paymentMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#848e9c]">Account Holder Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Full name on account"
                  className="w-full rounded-lg border border-white/[0.06] bg-[#0b0e11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#848e9c]">Account Number / Phone</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account number"
                  className="w-full rounded-lg border border-white/[0.06] bg-[#0b0e11] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={submitting || !amountETB || !amountUSDT}
          className={`w-full rounded-xl py-4 font-bold text-white transition disabled:opacity-50 ${
            isBuy ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {submitting ? "Placing Order..." : isBuy ? "Buy USDT" : "Sell USDT"}
        </button>

      </main>
    </div>
  );
}
