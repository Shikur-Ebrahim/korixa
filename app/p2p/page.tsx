"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
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
  const [activeTab, setActiveTab] = useState<"buy" | "sell" | "myads">("buy");
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterAmount, setFilterAmount] = useState("");
  const [filterPayment, setFilterPayment] = useState<PaymentMethod | "All">("All");
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);

  useEffect(() => {
    if (activeTab === "myads") return;
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
          
          <button
            onClick={() => router.push("/p2p/orders")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
          >
            <FiClock size={16} />
          </button>
          {isVerified && (
            <button
              onClick={() => router.push("/p2p/create-ad")}
              className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-bold text-black"
            >
              <FiPlus size={13} /> Create Ad
            </button>
          )}
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
            className={`pb-2.5 pt-3 text-sm font-semibold transition-colors mr-6 ${
              activeTab === "sell"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-[#848e9c] hover:text-red-500"
            }`}
          >
            Sell USDT
          </button>
          <button
            onClick={() => setActiveTab("myads")}
            className={`pb-2.5 pt-3 text-sm font-semibold transition-colors ${
              activeTab === "myads"
                ? "border-b-2 border-primary text-primary"
                : "text-[#848e9c] hover:text-primary"
            }`}
          >
            My Ads
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
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPaymentDropdownOpen(false)} />
                <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] rounded-xl border border-white/[0.08] bg-[#1e2329] shadow-2xl overflow-hidden">
                  {["All", ...PAYMENT_METHODS].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setFilterPayment(m as PaymentMethod | "All"); setPaymentDropdownOpen(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-medium transition-colors border-b border-white/[0.04] last:border-0 ${
                        m === filterPayment ? "bg-primary/10 text-primary" : "text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      {m}
                      {m === filterPayment && (
                        <svg className="h-3 w-3 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* My Ads Tab */}
      {activeTab === "myads" && (
        <MyAdsSection userId={user?.uid ?? ""} onCreateAd={() => router.push("/p2p/create-ad")} isVerified={isVerified} />
      )}

      {/* Ad List */}
      {activeTab !== "myads" && (<div className="px-4 pt-2 pb-4 space-y-3">
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
    </div>
  );
}

// My Ads section component
function MyAdsSection({ userId, onCreateAd, isVerified }: { userId: string; onCreateAd: () => void; isVerified: boolean }) {
  const [myAds, setMyAds] = useState<import("@/lib/p2p/types").P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(getClientFirestore(), "p2pAdvertisements"),
      where("merchantId", "==", userId)
    );
    const unsub = onSnapshot(q, snap => {
      setMyAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as import("@/lib/p2p/types").P2PAdvertisement)));
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const toggleAdStatus = async (adId: string, currentStatus: string) => {
    await updateDoc(doc(getClientFirestore(), "p2pAdvertisements", adId), {
      status: currentStatus === "active" ? "disabled" : "active",
    });
  };

  if (!isVerified) {
    return (
      <div className="px-4 py-16 text-center">
        <FiShield size={32} className="mx-auto mb-3 text-orange-400" />
        <p className="text-sm font-semibold text-white">KYC Required</p>
        <p className="mt-1 text-xs text-[#848e9c]">Complete verification to create ads.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <button
        onClick={onCreateAd}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-black"
      >
        <FiPlus size={16} /> Create New Sell Ad
      </button>
      {loading ? (
        <div className="py-8 text-center text-xs text-[#848e9c]">Loading...</div>
      ) : myAds.length === 0 ? (
        <div className="py-12 text-center">
          <FiList size={28} className="mx-auto mb-3 text-[#848e9c]" />
          <p className="text-sm text-[#848e9c]">No ads yet. Create your first sell ad!</p>
        </div>
      ) : (
        myAds.map(ad => (
          <div key={ad.id} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ ad.status === "active" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400" }`}>
                {ad.status === "active" ? "● Active" : "● Paused"}
              </span>
              <button
                onClick={() => toggleAdStatus(ad.id, ad.status)}
                className="text-[10px] font-bold text-[#848e9c] border border-white/[0.08] rounded-lg px-2.5 py-1 hover:text-white transition"
              >
                {ad.status === "active" ? "Pause" : "Activate"}
              </button>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-[#848e9c]">Price</span>
              <span className="font-bold text-white">{ad.price.toLocaleString()} ETB/USDT</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-[#848e9c]">Available</span>
              <span className="font-bold text-white">{ad.availableUSDT} USDT</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-[#848e9c]">Limits</span>
              <span className="text-white">{ad.minOrderLimit.toLocaleString()} – {ad.maxOrderLimit.toLocaleString()} ETB</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {ad.paymentMethods.map(m => (
                <span key={m} className="rounded bg-[#2b3139] px-1.5 py-0.5 text-[10px] text-[#848e9c]">{m}</span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
