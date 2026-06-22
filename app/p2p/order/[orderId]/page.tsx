"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiMessageSquare, FiUploadCloud, FiCheck, FiX, FiClock, FiLoader } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuth } from "firebase/auth";
import type { P2POrder, P2PMessage } from "@/lib/p2p/types";

export default function P2POrderRoomPage() {
  const router = useRouter();
  const params = useParams();
  const { user, role } = useAuth();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<P2POrder | null>(null);
  const [messages, setMessages] = useState<P2PMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Real-time order listener
    const unsubOrder = onSnapshot(doc(getClientFirestore(), "p2pOrders", orderId), (doc) => {
      if (doc.exists()) setOrder({ id: doc.id, ...doc.data() } as P2POrder);
      setLoading(false);
    });

    // Real-time chat listener
    const q = query(
      collection(getClientFirestore(), `p2pOrders/${orderId}/messages`),
      orderBy("createdAt", "asc")
    );
    const unsubChat = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMessage)));
    });

    return () => {
      unsubOrder();
      unsubChat();
    };
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;

    const interval = setInterval(() => {
      const expires = new Date(order.expiresAt).getTime();
      const now = Date.now();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "cancelled" });
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order, orderId]);

  const handleMarkPaid = async () => {
    if (!confirm("Have you sent the money and uploaded the proof?")) return;
    await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "paid" });
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "cancelled" });
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      // Convert to base64 and upload via server-side /api/upload (same as KYC)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = await getAuth().currentUser?.getIdToken();
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64,
          folder: `korixa/p2p/${orderId}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), {
        paymentProofUrl: data.url,
      });
      alert("Proof uploaded successfully! ✅");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0b0e11] pt-24 text-center text-[#848e9c]">Loading order...</div>;
  if (!order) return <div className="min-h-screen bg-[#0b0e11] pt-24 text-center text-red-500">Order not found.</div>;

  const isBuyer = user?.uid === order.buyerId;
  const isAdminOrMerchant = role === "admin" || user?.uid === order.merchantId;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-[#0b0e11]/95 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#848e9c] transition hover:text-white">
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Order Details</h1>
        </div>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="relative rounded-full bg-[#1e2329] p-2 text-[#848e9c] transition hover:text-white"
        >
          <FiMessageSquare size={18} />
          {messages.length > 0 && (
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-6">
        {/* Status Card */}
        <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-6 text-center">
          <h2 className="text-2xl font-black capitalize text-primary">{order.status}</h2>
          {order.status === "pending" && (
            <div className="mt-2 flex items-center justify-center gap-2 text-[#848e9c]">
              <FiClock />
              <span>Time left: <span className="font-bold text-white">{timeLeft}</span></span>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4 divide-x divide-white/[0.06] border-t border-white/[0.06] pt-6">
            <div>
              <div className="text-xs text-[#848e9c]">Fiat Amount</div>
              <div className="text-xl font-bold">{order.amountETB.toLocaleString()} ETB</div>
            </div>
            <div>
              <div className="text-xs text-[#848e9c]">Crypto Amount</div>
              <div className="text-xl font-bold">{order.amountUSDT.toLocaleString()} USDT</div>
            </div>
          </div>
        </div>

        {/* Payment Instructions — show real account details */}
        <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4 space-y-3">
          <h3 className="text-sm font-bold">Payment Details</h3>
          <p className="text-xs text-[#848e9c]">
            Transfer exactly <span className="font-bold text-white">{order.amountETB.toLocaleString()} ETB</span> to one of the accounts below. Then upload your receipt and click "I Have Paid".
          </p>
          {order.paymentAccountDetails && order.paymentAccountDetails.length > 0 ? (
            order.paymentAccountDetails.map((detail) => (
              <div key={detail.method} className="rounded-lg border border-white/[0.06] bg-[#0b0e11] p-3">
                <div className="mb-2 text-xs font-bold text-primary">{detail.method}</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#848e9c]">Account Name</span>
                    <span className="text-[11px] font-semibold text-white">{detail.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[#848e9c]">
                      {detail.method === "Telebirr" ? "Phone Number" : "Account Number"}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-white">{detail.accountNumber}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-[#848e9c]">
              Contact the merchant via chat for payment details.
            </p>
          )}
        </div>

        {/* Proof of Payment */}
        <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
          <h3 className="text-sm font-bold mb-3">Payment Proof</h3>
          {order.paymentProofUrl ? (
            <div className="space-y-3">
              <img src={order.paymentProofUrl} alt="Proof" className="w-full rounded-lg" />
              <div className="text-center text-xs text-green-500 font-medium flex items-center justify-center gap-1">
                <FiCheck /> Proof Uploaded
              </div>
            </div>
          ) : (
            <div>
              <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition ${uploading ? "border-primary/40 text-primary cursor-not-allowed" : "border-white/[0.1] text-[#848e9c] hover:border-primary hover:text-primary"}`}>
                {uploading ? (
                  <>
                    <FiLoader size={24} className="mb-2 animate-spin" />
                    <span className="text-xs font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUploadCloud size={24} className="mb-2" />
                    <span className="text-xs font-medium">Upload receipt screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUploadProof} />
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        {order.status === "pending" && isBuyer && (
          <div className="flex gap-3">
            <button onClick={handleCancel} className="w-1/3 rounded-xl bg-[#2b3139] py-3 text-sm font-bold text-white transition hover:bg-[#3b4149]">
              Cancel
            </button>
            <button onClick={handleMarkPaid} className="w-2/3 rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90">
              I Have Paid
            </button>
          </div>
        )}

        {/* Admin/Merchant Actions */}
        {order.status === "paid" && isAdminOrMerchant && (
          <button
            onClick={async () => {
              if (confirm("Have you verified the payment in your bank?")) {
                await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "completed" });
              }
            }}
            className="w-full rounded-xl bg-green-500 py-4 text-sm font-bold text-white transition hover:bg-green-600"
          >
            Release {order.amountUSDT} USDT
          </button>
        )}

      </main>

      {/* Chat Drawer */}
      {chatOpen && <ChatDrawer orderId={orderId} onClose={() => setChatOpen(false)} messages={messages} user={user} />}
    </div>
  );
}

// Subcomponent for Chat
function ChatDrawer({ orderId, onClose, messages, user }: { orderId: string; onClose: () => void; messages: P2PMessage[]; user: any }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    try {
      await addDoc(collection(getClientFirestore(), `p2pOrders/${orderId}/messages`), {
        senderId: user.uid,
        senderName: user.email?.split("@")[0] || "User",
        text,
        createdAt: new Date().toISOString(),
      });
      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0e11]">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#161a1e] px-4 py-4">
        <h2 className="font-bold">Order Chat</h2>
        <button onClick={onClose} className="p-2 text-[#848e9c] transition hover:text-white">
          <FiX size={20} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === user?.uid ? "items-end" : "items-start"}`}>
            <span className="mb-1 text-[10px] text-[#848e9c]">{m.senderName}</span>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.senderId === user?.uid ? "bg-primary text-[#0b0e11]" : "bg-[#1e2329] text-white"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSend} className="border-t border-white/[0.06] bg-[#161a1e] p-4 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-white/[0.06] bg-[#0b0e11] px-4 py-2 text-sm text-white focus:border-primary focus:outline-none"
        />
        <button type="submit" disabled={!text.trim()} className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-[#0b0e11] disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
