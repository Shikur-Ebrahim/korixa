"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FiCheckCircle, FiArrowLeft, FiClock, FiShield, FiAlertTriangle, FiPlus, FiList } from "react-icons/fi";
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

export default function P2PMarketplace() {
  const router = useRouter();
  const { kycStatus, user } = useAuth();
  const isVerified = kycStatus === "verified";
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterAmount, setFilterAmount] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "All">("All");
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), "p2pAdvertisements"),
      where("status", "==", "active"),
      where("type", "==", activeTab)
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

  return (
    <div className="min-h-screen bg-[#0b0e11] pb-24 text-white">

      {/* KYC Verification Banner */}
      {!isVerified && (
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-orange-500/30 bg-orange-500/[0.08] px-4 py-3">
          <FiAlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">KYC Verification Required</p>
            <p className="mt-0.5 text-xs text-[#848e9c]">
              Complete identity verification to trade on P2P marketplace.
            </p>
          </div>
          <button
            onClick={() => router.push("/kyc?start=1")}
            className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition"
          >
            Verify
          </button>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
            >
              <FiArrowLeft size={16} />
            </button>
            <div>
              <h1 className="text-base font-bold leading-tight">P2P Trading</h1>
              <p className="text-[11px] text-[#848e9c]">Trade USDT with verified merchants</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!isVerified) return alert("KYC required");
                router.push("/p2p/my-ads");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => router.push("/p2p/orders")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
            >
              <FiClock size={16} />
            </button>
          </div>
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
        <div className="flex flex-wrap gap-2 px-4 py-2.5">
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

          <div className="relative flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1e2329] px-3 py-1.5">
            <span className="text-[11px] text-[#848e9c]">Pay</span>
            <button
              type="button"
              onClick={() => setPaymentDropdownOpen(p => !p)}
              className="flex items-center gap-1 bg-transparent text-xs text-white focus:outline-none whitespace-nowrap"
            >
              <span>{filterPayment}</span>
              <svg className={`h-3 w-3 text-[#848e9c] transition-transform ${paymentDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {paymentDropdownOpen && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end">
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                  onClick={() => setPaymentDropdownOpen(false)} 
                />
                <div className="relative bg-[#1e2329] rounded-t-3xl p-4 animate-in slide-in-from-bottom-full duration-300">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
                  <h3 className="mb-4 text-center text-sm font-bold text-white">Select Payment Method</h3>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {["All", ...PAYMENT_METHODS].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setFilterPayment(m as PaymentMethod | "All"); setPaymentDropdownOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition-colors ${
                          m === filterPayment ? "bg-primary/10 text-primary" : "bg-[#0b0e11] text-white"
                        }`}
                      >
                        {m}
                        {m === filterPayment && (
                          <FiCheckCircle size={16} className="text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ad List */}
      <div className="px-4 pt-2 pb-4 space-y-3">
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
                  {activeTab === "buy" && (
                    <>
                      <div className="text-[11px] text-[#848e9c]">Available</div>
                      <div className="text-xs font-medium text-white">{ad.availableUSDT.toLocaleString()} USDT</div>
                    </>
                  )}
                  <div className={`text-[11px] text-[#848e9c] ${activeTab === "sell" ? "mt-4" : ""}`}>
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
                  onClick={() => {
                    if (!isVerified) {
                      router.push("/kyc?start=1");
                    } else {
                      router.push(`/p2p/${activeTab}/${ad.id}`);
                    }
                  }}
                  className={`rounded-lg px-5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    !isVerified
                      ? "bg-[#2b3139] text-[#848e9c] border border-white/10"
                      : activeTab === "buy"
                        ? "bg-green-500 text-white hover:bg-green-600"
                        : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {!isVerified && <FiShield size={12} />}
                  {!isVerified ? "Verify" : activeTab === "buy" ? "Buy" : "Sell"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB: Create Advertisement */}
      <button
        onClick={() => {
          if (!isVerified) return alert("KYC verification is required before creating P2P advertisements.");
          router.push("/p2p/create-ad");
        }}
        className="fixed bottom-28 right-4 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[#0b0e11] shadow-xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
        style={{ boxShadow: "0 8px 32px rgba(247, 147, 26, 0.4)" }}
      >
        <FiPlus size={28} />
      </button>
    </div>
  );
}
