"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import type { P2POrder } from "@/lib/p2p/types";

export default function P2POrderHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"processing" | "all" | "completed" | "cancelled">("processing");

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getClientFirestore(), "p2pOrders"),
      where("buyerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2POrder)));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "processing") return o.status === "pending" || o.status === "paid";
    if (activeTab === "completed") return o.status === "completed";
    if (activeTab === "cancelled") return o.status === "cancelled";
    return true; // all
  });

  const TABS = [
    { id: "processing", label: "Processing" },
    { id: "all", label: "All" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0b0e11] pb-24 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
          >
            <FiArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold leading-tight">Order History</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06] px-4 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap mr-6 pb-2.5 pt-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-white"
                  : "text-[#848e9c] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-4 pb-4 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#848e9c]">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#848e9c]">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isBuy = order.type === "buy";
            const StatusIcon = 
              order.status === "completed" ? FiCheckCircle :
              order.status === "cancelled" ? FiXCircle : FiClock;

            const statusColor = 
              order.status === "completed" ? "text-green-500" :
              order.status === "cancelled" ? "text-[#848e9c]" :
              order.status === "paid" ? "text-blue-500" : "text-yellow-500";

            return (
              <div
                key={order.id}
                onClick={() => router.push(`/p2p/order/${order.id}`)}
                className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3.5 cursor-pointer active:scale-[0.98] transition-transform"
              >
                {/* Top Row: Buy/Sell & Status */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold ${isBuy ? "text-green-500" : "text-red-500"}`}>
                      {isBuy ? "Buy" : "Sell"}
                    </span>
                    <span className="text-sm font-bold text-white">USDT</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${statusColor} capitalize`}>
                    {order.status}
                    <StatusIcon size={14} />
                  </div>
                </div>

                {/* Details */}
                <div className="pt-3 flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-[#848e9c]">
                      <span>Amount</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {order.amountETB.toLocaleString()} ETB
                    </div>
                    <div className="text-[11px] text-[#848e9c]">
                      Price: {order.price.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-1 text-[11px] text-[#848e9c]">
                      <span>Crypto Amount</span>
                    </div>
                    <div className="text-sm font-medium text-white">
                      {order.amountUSDT.toLocaleString()} USDT
                    </div>
                    <div className="text-[11px] text-[#848e9c]">
                      {new Date(order.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 text-[11px] text-[#848e9c]">
                  <span>{order.merchantName || "Merchant"}</span>
                  <span className="font-mono">Order No. {order.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
