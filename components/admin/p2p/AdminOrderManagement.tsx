"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc
} from "firebase/firestore";
import {
  FiMessageSquare, FiCheck, FiX, FiSend,
  FiChevronDown, FiChevronUp, FiAlertCircle
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
      senderName: order.merchantName || "Merchant",
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
          const isMerchant = msg.senderId === order.merchantId || msg.senderId === (getAuth().currentUser?.uid ?? "admin") || msg.senderName === order.merchantName;
          return (
            <div key={msg.id} className={`flex ${isMerchant ? "justify-end" : "justify-start"}`}>
              {msg.imageUrl ? (
                <a href={msg.imageUrl} target="_blank" rel="noreferrer" className={`max-w-[75%] block overflow-hidden rounded-xl border ${isMerchant ? "border-primary/30" : "border-white/[0.08]"}`}>
                  <img
                    src={msg.imageUrl}
                    alt="screenshot"
                    className="w-full object-cover"
                    style={{ maxHeight: 200 }}
                  />
                </a>
              ) : (
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                  isMerchant ? "bg-primary/20 text-white" : "bg-[#1e2329] text-[#848e9c]"
                }`}>
                  {msg.text}
                </div>
              )}
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
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Listen for new messages to show the unread dot
  useEffect(() => {
    const q = query(
      collection(getClientFirestore(), `p2pOrders/${order.id}/messages`),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) return;
      // If chat is closed and there is at least one buyer message, show dot
      if (!chatOpen) {
        const latestMsg = snap.docs[0].data();
        // Show dot if message is from the buyer (not from admin)
        const isFromBuyer = latestMsg.senderId === order.buyerId;
        setHasUnread(isFromBuyer);
      } else {
        setHasUnread(false);
      }
    });
    return () => unsub();
  }, [order.id, order.buyerId, chatOpen]);

  const callOrderAction = async (action: "release" | "reject") => {
    const confirmMsg = action === "release"
      ? `Release ${order.amountUSDT} USDT to the buyer? This will credit their funding wallet.`
      : "Reject this order? The buyer will be notified. No funds will be moved.";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setActionMsg(null);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/admin/p2p/order-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({
          ok: true,
          text: action === "release"
            ? `Successfully released ${order.amountUSDT} USDT to buyer's funding wallet!`
            : "Order successfully rejected. No funds were transferred.",
        });
      } else {
        setActionMsg({ ok: false, text: data.error || "Action failed." });
      }
    } catch (e: any) {
      setActionMsg({ ok: false, text: "Connection error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const releaseUSDT = () => callOrderAction("release");
  const rejectOrder = () => callOrderAction("reject");

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ file: base64, folder: `korixa/p2p/${order.id}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await updateDoc(doc(getClientFirestore(), "p2pOrders", order.id), { paymentProofUrl: data.url });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(getClientFirestore(), "p2pOrders", order.id), { status: "paid" });
      setActionMsg({ ok: true, text: "Marked as paid. The user will verify and release USDT." });
    } catch (err) {
      setActionMsg({ ok: false, text: "Failed to mark as paid." });
    } finally {
      setLoading(false);
    }
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
          
          {/* If SELL order, admin needs to pay the user */}
          {order.type === "sell" && (
            <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-3 space-y-3">
              <h3 className="text-xs font-bold text-white">User's Payment Details</h3>
              <p className="text-[10px] text-[#848e9c]">
                You are buying USDT from the user. Transfer exactly <span className="font-bold text-white">{order.amountETB.toLocaleString()} ETB</span> to their account.
              </p>
              {order.paymentAccountDetails && order.paymentAccountDetails.length > 0 ? (
                order.paymentAccountDetails.map((detail) => (
                  <div key={detail.method} className="rounded-lg border border-white/[0.06] bg-[#0b0e11] p-2">
                    <div className="mb-1 text-[10px] font-bold text-primary">{detail.method}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#848e9c]">Account Name</span>
                        <span className="text-[10px] font-semibold text-white">{detail.accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-[#848e9c]">Account Number</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-white">{detail.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(detail.accountNumber);
                              setCopied(detail.method);
                              setTimeout(() => setCopied(null), 2000);
                            }}
                            className="flex items-center justify-center rounded bg-[#1e2329] p-1 text-[#848e9c] transition hover:bg-primary/20 hover:text-primary"
                          >
                            {copied === detail.method ? <FiCheck size={10} className="text-green-400" /> : <FiCopy size={10} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-red-400">User did not provide payment details. Ask them in chat.</div>
              )}
            </div>
          )}

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
          ) : order.type === "sell" && order.status === "pending" ? (
            <div>
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed py-4 transition ${uploading ? "border-primary/40 text-primary" : "border-white/[0.1] text-[#848e9c] hover:border-primary hover:text-primary"}`}>
                {uploading ? (
                  <span className="text-[10px] font-medium">Uploading...</span>
                ) : (
                  <>
                    <FiUploadCloud size={16} className="mb-1" />
                    <span className="text-[10px] font-medium">Upload receipt</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUploadProof} />
              </label>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/[0.06] py-3 text-center text-[11px] text-[#848e9c]">
              No payment proof uploaded yet
            </div>
          )}

          {/* Action result message -> replaced by modal below */}

          {/* Action buttons */}
          {order.type === "buy" ? (
            // For BUY orders: Admin is selling USDT to user. User pays ETB. Admin releases USDT.
            order.status === "paid" && !actionMsg?.ok && (
              <div className="flex gap-2">
                <button onClick={rejectOrder} disabled={loading} className="flex-1 rounded-lg border border-red-500/30 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                  <FiX className="inline mr-1" />Reject
                </button>
                <button onClick={releaseUSDT} disabled={loading} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90 disabled:opacity-50">
                  <FiCheck className="inline mr-1" />Release USDT
                </button>
              </div>
            )
          ) : (
            // For SELL orders: Admin is buying USDT from user. Admin pays ETB, Admin clicks Mark Paid.
            order.status === "pending" && !actionMsg?.ok && (
              <div className="flex gap-2">
                <button onClick={rejectOrder} disabled={loading} className="flex-1 rounded-lg border border-red-500/30 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                  <FiX className="inline mr-1" />Cancel
                </button>
                <button onClick={handleMarkPaid} disabled={loading} className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90 disabled:opacity-50">
                  <FiCheck className="inline mr-1" />Mark as Paid
                </button>
              </div>
            )
          )}

          {/* Chat toggle with unread dot */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-2 text-xs font-medium text-[#848e9c] transition hover:border-primary hover:text-primary"
          >
            <FiMessageSquare size={13} />
            {chatOpen ? "Close Chat" : "Open Chat"}
            {hasUnread && !chatOpen && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="animate-pulse flex h-2 w-2 rounded-full bg-red-500" />
                <span className="text-[9px] font-bold text-red-400">New</span>
              </span>
            )}
          </button>

          {chatOpen && <ChatPanel order={order} onClose={() => setChatOpen(false)} />}
        </div>
      )}

      {/* ── SUCCESS/ERROR MODAL ── */}
      {actionMsg && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setActionMsg(null)}>
          <div
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0b0e11] p-6 shadow-2xl space-y-4 mb-2 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                actionMsg.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }`}>
                {actionMsg.ok ? <FiCheck size={32} /> : <FiX size={32} />}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white">
                {actionMsg.ok ? "Success!" : "Failed"}
              </h3>
              <p className="text-xs text-[#848e9c] mt-2 leading-relaxed">
                {actionMsg.text}
              </p>
            </div>

            <button
              onClick={() => setActionMsg(null)}
              className="w-full rounded-2xl bg-white/[0.06] py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.1] mt-4 active:scale-95"
            >
              Close
            </button>
          </div>
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
