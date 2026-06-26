"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, getDocs, collection, addDoc, updateDoc, increment, query, where } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiRefreshCw, FiDollarSign } from "react-icons/fi";
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

  // Seller specific state
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [sellerMethod, setSellerMethod] = useState<string>("");
  const [sellerAccountName, setSellerAccountName] = useState("");
  const [sellerAccountNumber, setSellerAccountNumber] = useState("");

  const isBuy = action === "buy";

  useEffect(() => {
    async function fetchAd() {
      try {
        const adSnap = await getDoc(doc(getClientFirestore(), "p2pAdvertisements", adId));
        if (adSnap.exists()) {
          setAd({ id: adSnap.id, ...adSnap.data() } as P2PAdvertisement);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAd();

    // Fetch user wallet if selling
    if (user && action === "sell") {
      const fetchWallet = async () => {
        const q = query(collection(getClientFirestore(), "wallets"), where("userId", "==", user.uid), where("coin", "==", "USDT"), where("type", "==", "funding"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUsdtBalance(snap.docs[0].data().availableBalance ?? 0);
          setWalletId(snap.docs[0].id);
        }
      };
      fetchWallet();
    }
  }, [adId, user, action]);

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
      alert(`Amount exceeds ad capacity of ${ad.availableUSDT} USDT.`);
      return;
    }

    if (!isBuy) {
      if (usdt > usdtBalance) {
        alert("Insufficient USDT balance. Please deposit to your funding wallet.");
        return;
      }
      if (!sellerMethod || !sellerAccountName || !sellerAccountNumber) {
        alert("Please provide your payment account details.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const db = getClientFirestore();

      // If user is selling, deduct USDT from their wallet immediately
      if (!isBuy && walletId) {
        await updateDoc(doc(db, "wallets", walletId), {
          availableBalance: increment(-usdt),
          balance: increment(-usdt),
        });
      }

      const orderData: Omit<P2POrder, "id"> = {
        adId: ad.id,
        merchantId: ad.merchantId,
        merchantName: ad.merchantName,
        buyerId: user.uid,
        type: action,
        amountUSDT: usdt,
        amountETB: etb,
        price: ad.price,
        paymentMethod: isBuy ? ad.paymentMethods[0] : (sellerMethod as any),
        paymentAccountDetails: isBuy 
          ? (ad.paymentAccountDetails ?? []) 
          : [{ method: sellerMethod as any, accountName: sellerAccountName, accountNumber: sellerAccountNumber }],
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
          <div className="flex items-center justify-between">
            <span className="font-semibold">{ad.merchantName}</span>
            {!isBuy && (
              <div className="flex items-center gap-1.5 text-xs text-[#848e9c]">
                <FiDollarSign size={12} className="text-primary" />
                Your balance: <span className="font-bold text-white">{usdtBalance.toFixed(4)}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-between">
            <div>
              <div className="text-xs text-[#848e9c]">Price</div>
              <div className={`text-xl font-bold ${isBuy ? "text-green-500" : "text-red-500"}`}>
                {ad.price} ETB
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#848e9c]">
                {isBuy ? "Available" : "Wanted"}
              </div>
              <div className="font-medium">{ad.availableUSDT} USDT</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-[#848e9c]">
            Limits: {ad.minOrderLimit} - {ad.maxOrderLimit} ETB
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          {/* Top Input */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
            <label className="text-xs font-medium text-[#848e9c]">
              {isBuy ? "I want to pay" : "I will sell"}
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={isBuy ? amountETB : amountUSDT}
                onChange={isBuy ? handleFiatChange : handleCryptoChange}
                placeholder={isBuy ? `Min ${ad.minOrderLimit}` : "0.00"}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
              />
              <span className="font-bold text-white">{isBuy ? "ETB" : "USDT"}</span>
            </div>
          </div>

          <div className="flex justify-center text-[#848e9c]">
            <FiRefreshCw size={16} />
          </div>

          {/* Bottom Input */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
            <label className="text-xs font-medium text-[#848e9c]">
              {isBuy ? "I will receive" : "I will get"}
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={isBuy ? amountUSDT : amountETB}
                onChange={isBuy ? handleCryptoChange : handleFiatChange}
                placeholder={isBuy ? "0.00" : `Min ${ad.minOrderLimit}`}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
              />
              <span className="font-bold text-white">{isBuy ? "USDT" : "ETB"}</span>
            </div>
          </div>
        </div>

        {/* Seller Payment Details */}
        {!isBuy && (
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4 space-y-3">
            <h3 className="text-sm font-bold">Your Receiving Account</h3>
            <p className="text-xs text-[#848e9c]">Where should the buyer send the ETB?</p>
            
            <div className="flex flex-col gap-2">
              {ad.paymentMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => setSellerMethod(m)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-sm font-semibold transition ${
                    sellerMethod === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/[0.06] bg-[#0b0e11] text-white"
                  }`}
                >
                  {m}
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      sellerMethod === m ? "border-primary bg-primary" : "border-white/20"
                    }`}
                  >
                    {sellerMethod === m && <div className="h-2 w-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>

            {sellerMethod && (
              <div className="space-y-2">
                <input
                  placeholder="Your full name on the account"
                  value={sellerAccountName}
                  onChange={e => setSellerAccountName(e.target.value)}
                  className="w-full rounded-lg bg-[#0b0e11] px-3 py-3 text-sm text-white border border-white/[0.06] focus:outline-none"
                />
                <input
                  placeholder="Account or Phone Number"
                  value={sellerAccountNumber}
                  onChange={e => setSellerAccountNumber(e.target.value)}
                  className="w-full rounded-lg bg-[#0b0e11] px-3 py-3 text-sm text-white border border-white/[0.06] focus:outline-none"
                />
              </div>
            )}
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
              <p className="text-[11px] text-orange-300">
                <strong>Note:</strong> {amountUSDT || "0.00"} USDT will be locked in escrow when you place this order.
              </p>
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
