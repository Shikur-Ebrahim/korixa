"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { FiArrowLeft, FiPlus, FiEdit2, FiPauseCircle, FiPlayCircle, FiTrash2 } from "react-icons/fi";
import type { P2PAdvertisement } from "@/lib/p2p/types";

export default function MyAdsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "paused" | "disabled">("active");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getClientFirestore(), "p2pAdvertisements"),
      where("merchantId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as P2PAdvertisement));
      setAds(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const updateStatus = async (id: string, status: "active" | "paused" | "disabled") => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await updateDoc(doc(getClientFirestore(), "p2pAdvertisements", id), { status });
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  const deleteAd = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this ad?")) return;
    try {
      await deleteDoc(doc(getClientFirestore(), "p2pAdvertisements", id));
    } catch (e: any) {
      alert("Failed to delete ad: " + e.message);
    }
  };

  const filtered = ads.filter(ad => {
    if (activeTab === "active") return ad.status === "active";
    if (activeTab === "paused") return ad.status === "paused";
    if (activeTab === "disabled") return ad.status === "disabled";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/p2p")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
          >
            <FiArrowLeft size={16} />
          </button>
          <h1 className="text-sm font-bold">My Advertisements</h1>
        </div>
        <button
          onClick={() => router.push("/p2p/create-ad")}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary"
        >
          <FiPlus size={16} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] px-4">
        {(["active", "paused", "disabled"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-6 pb-2.5 pt-3 text-xs font-semibold capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-[#848e9c] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ad List */}
      <main className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="py-12 text-center text-xs text-[#848e9c]">Loading ads...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#848e9c]">
            No {activeTab} advertisements found.
          </div>
        ) : (
          filtered.map(ad => (
            <div key={ad.id} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${ad.type === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {ad.type === 'buy' ? "BUY" : "SELL"} USDT
                </span>
                <span className="text-xs font-bold text-white">{ad.price} ETB</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#848e9c]">Amount</span>
                  <span className="text-white font-medium">{ad.availableUSDT} USDT</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#848e9c]">Limits</span>
                  <span className="text-white font-medium">{ad.minOrderLimit} - {ad.maxOrderLimit} ETB</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#848e9c]">Methods</span>
                  <span className="text-white font-medium">{ad.paymentMethods.join(", ")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                {ad.status === "active" && (
                  <button onClick={() => updateStatus(ad.id, "paused")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2b3139] py-2 text-[11px] font-bold text-white hover:bg-[#333a43] transition">
                    <FiPauseCircle size={14} /> Pause
                  </button>
                )}
                {ad.status === "paused" && (
                  <button onClick={() => updateStatus(ad.id, "active")} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500/20 py-2 text-[11px] font-bold text-green-400 hover:bg-green-500/30 transition">
                    <FiPlayCircle size={14} /> Resume
                  </button>
                )}
                <button onClick={() => deleteAd(ad.id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/20 transition">
                  <FiTrash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
