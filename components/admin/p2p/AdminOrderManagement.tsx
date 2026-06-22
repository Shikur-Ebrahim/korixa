"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, query, orderBy, onSnapshot, updateDoc, doc,
  addDoc, serverTimestamp
} from "firebase/firestore";
import {
  FiMessageSquare, FiCheck, FiX, FiImage, FiSend,
  FiClock, FiChevronDown, FiChevronUp
} from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import type { P2POrder, P2PMessage } from "@/lib/p2p/types";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-400",
  paid:      "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-[#2b3139] text-[#848e9c]",
  disputed:  "bg-red-500/20 text-red-400",
};

function ChatPanel({ order, onClose }: { order: P2POrder; onClose: () => void }) {
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), `p2pOrders/${order.id}/messages`),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMessage)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    return () => unsub();
  }, [order.id]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const uid = getAuth().currentUser?.uid ?? "admin";
    await addDoc(collection(getClientFirestore(), `p2pOrders/${order.id}/messages`), {
      senderId: uid,
      senderName: "Admin",
      text: trimmed,
      createdAt: new Date().toISOString(),
    });
    setText("");
  };

  return (
    <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#0b0e11] flex flex-col" style={{ height: 320 }}>
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
        <span className="text-xs font-semibold text-white">
          Chat — Order #{order.id.slice(-6).toUpperCase()}
        </span>
        <button onClick={onClose} className="text-[#848e9c] hover:text-white">
          <FiX size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 px-3 py-3">
        {messages.length === 0 && (
          <div className="text-center text-[11px] text-[#848e9c] pt-4">No messages yet</div>
        )}
        {messages.map((msg) => {
          const isMerchant = msg.senderName === "Admin" || msg.senderId === order.merchantId;
          return (
            <div key={msg.id} className={`flex ${isMerchant ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                isMerchant ? "bg-primary/20 text-white" : "bg-[#1e2329] text-[#848e9c]"
              }`}>
                {msg.imageUrl ? (
                  <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary underline">
                    <FiImage size={12} /> View Image
                  </a>
                ) : msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-3 py-2 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Reply as merchant..."
          className="flex-1 bg-transparent text-xs text-white placeholder:text-[#848e9c] focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[#0b0e11]"
        >
          <FiSend size={12} />
        </button>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: P2POrder }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const releaseUSDT = async () => {
    if (!confirm(`Release ${order.amountUSDT} USDT for this order?`)) return;
    setLoading(true);
    await updateDoc(doc(getClientFirestore(), "p2pOrders", order.id), { status: "completed" });
    setLoading(false);
  };

  const rejectOrder = async () => {
    if (!confirm("Reject this order? The buyer will be notified.")) return;
    setLoading(true);
    await updateDoc(doc(getClientFirestore(), "p2pOrders", order.id), { status: "cancelled" });
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#0b0e11] overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#848e9c]">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
              {order.status}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${order.type === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {order.type.toUpperCase()}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-white">
            <span className="font-semibold">{order.amountUSDT} USDT</span>
            <span className="text-[#848e9c]">= {order.amountETB.toLocaleString()} ETB</span>
            <span className="text-[#848e9c]">@ {order.price}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-[#848e9c]">
            Merchant: {order.merchantId?.slice(0, 16)}… · {order.paymentMethod}
          </div>
        </div>
        {expanded ? <FiChevronUp size={14} className="shrink-0 text-[#848e9c]" /> : <FiChevronDown size={14} className="shrink-0 text-[#848e9c]" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-3 pb-3 space-y-3 pt-3">
          {/* Payment proof */}
          {order.paymentProofUrl ? (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold text-[#848e9c] uppercase tracking-wide">Payment Proof</div>
              <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                <img
                  src={order.paymentProofUrl}
                  alt="Payment proof"
                  className="w-full max-h-48 rounded-lg object-cover border border-white/[0.06] hover:opacity-90 transition"
                />
              </a>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/[0.06] py-3 text-center text-[11px] text-[#848e9c]">
              No payment proof uploaded yet
            </div>
          )}

          {/* Action buttons */}
          {order.status === "paid" && (
            <div className="flex gap-2">
              <button
                onClick={rejectOrder}
                disabled={loading}
                className="flex-1 rounded-lg border border-red-500/30 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                <FiX className="inline mr-1" />Reject
              </button>
              <button
                onClick={releaseUSDT}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90 disabled:opacity-50"
              >
                <FiCheck className="inline mr-1" />Release USDT
              </button>
            </div>
          )}

          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-2 text-xs font-medium text-[#848e9c] transition hover:border-primary hover:text-primary"
          >
            <FiMessageSquare size={13} />
            {chatOpen ? "Close Chat" : "Open Chat"}
          </button>

          {chatOpen && <ChatPanel order={order} onClose={() => setChatOpen(false)} />}
        </div>
      )}
    </div>
  );
}

export function AdminOrderManagement() {
  const [orders, setOrders] = useState<P2POrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "completed" | "cancelled">("all");

  useEffect(() => {
    const q = query(collection(getClientFirestore(), "p2pOrders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2POrder)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const paidCount = orders.filter((o) => o.status === "paid").length;

  if (loading) return <div className="py-8 text-center text-sm text-[#848e9c]">Loading orders...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">
          Orders
          {paidCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-[#0b0e11]">
              {paidCount} need action
            </span>
          )}
        </h3>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {(["all","paid","pending","completed","cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
              filter === s ? "bg-primary text-[#0b0e11]" : "bg-[#0b0e11] text-[#848e9c] hover:text-white"
            }`}
          >
            {s}
            {s !== "all" && (
              <span className="ml-1 opacity-70">
                ({orders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] py-10 text-center text-sm text-[#848e9c]">
            No orders{filter !== "all" ? ` with status "${filter}"` : ""} yet.
          </div>
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
