"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCheckCircle, FiClock } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { P2PAdvertisement, PaymentMethod } from "@/lib/p2p/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

export function P2PTradePanel() {
  const router = useRouter();
  const { kycStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterAmount, setFilterAmount] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "All">("All");

  const verified = kycStatus === "verified";

  useEffect(() => {
    const adType = activeTab === "buy" ? "sell" : "buy";
    const q = query(
      collection(getClientFirestore(), "p2pAdvertisements"),
      where("status", "==", "active"),
      where("type", "==", adType)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PAdvertisement));
      if (filterAmount) {
        const amount = Number(filterAmount);
        data = data.filter((ad) => amount >= ad.minOrderLimit && amount <= ad.maxOrderLimit);
      }
      if (filterPayment !== "All") {
        data = data.filter((ad) => ad.paymentMethods.includes(filterPayment));
      }
      setAds(data);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab, filterAmount, filterPayment]);

  const handleAction = (adId: string) => {
    if (!verified) {
      router.push("/kyc?start=1");
      return;
    }
    router.push(`/p2p/${activeTab}/${adId}`);
  };

  return (
    <div className="space-y-3">
      {!verified && (
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5">
          <p className="text-xs font-medium text-white">
            Complete KYC verification to enable P2P trading.
          </p>
          <Link href="/kyc?start=1" className="mt-1 inline-block text-xs font-semibold text-primary">
            Verify now →
          </Link>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="rounded-xl bg-[#0b0e11] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div>
            <h2 className="text-base font-bold leading-tight text-white">P2P Market</h2>
          </div>
          <button
            onClick={() => router.push("/p2p/orders")}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#848e9c] hover:text-white transition"
          >
            <FiClock size={14} /> Orders
          </button>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="flex border-b border-white/[0.06] px-4">
          <button
            onClick={() => setActiveTab("buy")}
            className={`mr-6 pb-2.5 pt-3 text-sm font-semibold transition-colors ${
              activeTab === "buy"
                ? "border-b-2 border-green-500 text-green-500"
                : "text-[#848e9c] hover:text-green-500"
            }`}
          >
            Buy USDT
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`pb-2.5 pt-3 text-sm font-semibold transition-colors ${
              activeTab === "sell"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-[#848e9c] hover:text-red-500"
            }`}
          >
            Sell USDT
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1e2329] px-3 py-1.5">
            <span className="text-[11px] text-[#848e9c]">Amount</span>
            <input
              type="number"
              placeholder="ETB"
              value={filterAmount}
              onChange={(e) => setFilterAmount(e.target.value)}
              className="w-20 bg-transparent text-xs text-white placeholder:text-[#848e9c] focus:outline-none"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1e2329] px-3 py-1.5">
            <span className="text-[11px] text-[#848e9c]">Pay</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as PaymentMethod | "All")}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="All" className="bg-[#1e2329] text-white">All</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m} className="bg-[#1e2329] text-white">{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ad List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#848e9c]">Loading offers...</div>
        ) : ads.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#848e9c]">
            No offers found. Try changing filters.
          </div>
        ) : (
          ads.map((ad) => (
            <div
              key={ad.id}
              className={`rounded-xl p-3.5 transition-colors border shadow-lg shadow-black/20 ${
                activeTab === "buy"
                  ? "bg-gradient-to-br from-[#0d1829] to-[#0b0e11] border-blue-900/40 hover:border-blue-700/60"
                  : "bg-gradient-to-br from-[#1f1f22] to-[#0b0e11] border-[#333336] hover:border-[#444448]"
              }`}
            >
              {/* Merchant Row */}
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2b3139] text-xs font-bold text-white">
                  {ad.merchantName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-white">{ad.merchantName}</span>
                    {ad.merchantVerified && <FiCheckCircle className="text-primary" size={12} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#848e9c]">
                    <span>{ad.merchantTotalOrders} orders</span>
                    <span>·</span>
                    <span>{ad.merchantCompletionRate}% completion</span>
                  </div>
                </div>
              </div>

              {/* Price & Limits */}
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] text-[#848e9c]">Price</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-base font-bold ${activeTab === "buy" ? "text-green-500" : "text-red-500"}`}>
                      {ad.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-white">ETB</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#848e9c]">Available</div>
                  <div className="text-xs font-medium text-white">{ad.availableUSDT.toLocaleString()} USDT</div>
                  <div className="text-[11px] text-[#848e9c]">
                    {ad.minOrderLimit.toLocaleString()} – {ad.maxOrderLimit.toLocaleString()} ETB
                  </div>
                </div>
              </div>

              {/* Payment Methods & Action */}
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {ad.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded bg-[#2b3139] px-1.5 py-0.5 text-[10px] font-medium text-[#848e9c]"
                    >
                      {method}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleAction(ad.id)}
                  className={`rounded-lg px-5 py-1.5 text-xs font-bold transition ${
                    !verified
                      ? "bg-primary text-[#0b0e11] hover:bg-primary/90"
                      : activeTab === "buy"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {!verified ? "Verify to " + (activeTab === "buy" ? "Buy" : "Sell") : activeTab === "buy" ? "Buy" : "Sell"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
