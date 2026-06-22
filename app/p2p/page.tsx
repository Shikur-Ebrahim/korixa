"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiFilter, FiArrowRight } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import type { P2PAdvertisement, PaymentMethod } from "@/lib/p2p/types";

const PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

export default function P2PMarketplace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAmount, setFilterAmount] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "All">("All");

  useEffect(() => {
    // If user wants to "Buy USDT", we need to look for ads where the merchant is "selling" USDT to them.
    // Wait, standard P2P terminology:
    // If I want to BUY crypto, I look for ads created by merchants who want to SELL crypto.
    // Actually, in Binance, "Buy" tab shows "Sell Ads" from merchants.
    // So if activeTab === "buy", query for type === "sell".
    
    const adType = activeTab === "buy" ? "sell" : "buy";
    
    const q = query(
      collection(getClientFirestore(), "p2pAdvertisements"),
      where("status", "==", "active"),
      where("type", "==", adType)
    );

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PAdvertisement));
      
      // Apply filters client-side for simplicity
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

  return (
    <div className="min-h-screen bg-[#0b0e11] pb-24 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold">P2P Trading</h1>
          <p className="mt-1 text-sm text-[#848e9c]">Trade USDT safely with verified merchants</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/[0.06] px-4">
          <button
            onClick={() => setActiveTab("buy")}
            className={`pb-3 text-lg font-bold transition-colors ${
              activeTab === "buy" ? "border-b-2 border-primary text-white" : "text-[#848e9c] hover:text-white"
            }`}
          >
            Buy USDT
          </button>
          <button
            onClick={() => setActiveTab("sell")}
            className={`pb-3 text-lg font-bold transition-colors ${
              activeTab === "sell" ? "border-b-2 border-red-500 text-white" : "text-[#848e9c] hover:text-white"
            }`}
          >
            Sell USDT
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1e2329] px-3 py-1.5">
            <span className="text-xs font-medium text-[#848e9c]">Amount</span>
            <input
              type="number"
              placeholder="Enter ETB"
              value={filterAmount}
              onChange={(e) => setFilterAmount(e.target.value)}
              className="w-24 bg-transparent text-sm text-white placeholder:text-[#848e9c] focus:outline-none"
            />
            <span className="text-xs font-bold">ETB</span>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-lg bg-[#1e2329] px-3 py-1.5">
            <span className="text-xs font-medium text-[#848e9c]">Payment</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as PaymentMethod | "All")}
              className="bg-transparent text-sm text-white focus:outline-none"
            >
              <option value="All">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ad List */}
      <div className="px-4 py-2 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-[#848e9c]">Loading offers...</div>
        ) : ads.length === 0 ? (
          <div className="py-12 text-center text-[#848e9c]">
            No offers found matching your criteria.
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4">
              {/* Merchant Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2b3139] text-sm font-bold text-white">
                    {ad.merchantName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-white">{ad.merchantName}</span>
                      {ad.merchantVerified && <FiCheckCircle className="text-primary" size={14} />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#848e9c]">
                      <span>{ad.merchantTotalOrders} orders</span>
                      <span>|</span>
                      <span>{ad.merchantCompletionRate}% completion</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Limits */}
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] text-[#848e9c]">Price</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${activeTab === "buy" ? "text-green-500" : "text-red-500"}`}>
                      {ad.price.toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-white">ETB</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#848e9c]">Available: {ad.availableUSDT.toLocaleString()} USDT</div>
                  <div className="text-[10px] text-white">
                    Limits: {ad.minOrderLimit.toLocaleString()} - {ad.maxOrderLimit.toLocaleString()} ETB
                  </div>
                </div>
              </div>

              {/* Payment Methods & Action */}
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {ad.paymentMethods.map((method) => (
                    <span key={method} className="relative pl-3 text-[10px] font-medium text-[#848e9c]">
                      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                      {method}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/p2p/${activeTab}/${ad.id}`)}
                  className={`rounded-lg px-6 py-2 text-sm font-bold transition ${
                    activeTab === "buy"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {activeTab === "buy" ? "Buy" : "Sell"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
