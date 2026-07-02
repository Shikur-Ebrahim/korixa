"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, updateDoc, collection, addDoc, query, orderBy } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiMessageSquare, FiUploadCloud, FiCheck, FiX, FiClock, FiLoader, FiImage, FiCopy } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { getAuth } from "firebase/auth";
import type { P2POrder, P2PMessage } from "@/lib/p2p/types";
import { AppealModal } from "./AppealModal";

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
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);

  const [timeLeft, setTimeLeft] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
    await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "paid" });
    showToast("Marked as paid! The merchant will verify your payment. ✅");
  };

  const handleCancel = async () => {
    await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "cancelled" });
    showToast("Order cancelled.", "error");
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
      showToast("Payment proof uploaded successfully! ✅");
    } catch (err) {
      console.error("Upload failed", err);
      showToast("Failed to upload image. Please try again.", "error");
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
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold shadow-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
          style={{ minWidth: 200, maxWidth: "86vw" }}
        >
          <span className="text-sm">{toast.type === "success" ? "✅" : "❌"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

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

        {/* Payment Instructions */}
        <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4 space-y-3">
          <h3 className="text-sm font-bold">
            {order.type === "buy" ? "Payment Details" : "Your Payment Details (Merchant will pay here)"}
          </h3>
          <p className="text-xs text-[#848e9c]">
            {order.type === "buy" ? (
              <>Transfer exactly <span className="font-bold text-white">{order.amountETB.toLocaleString()} ETB</span> to one of the accounts below. Then upload your receipt and click "I Have Paid".</>
            ) : (
              <>Wait for the merchant to transfer exactly <span className="font-bold text-white">{order.amountETB.toLocaleString()} ETB</span> to your account below.</>
            )}
          </p>
          {order.paymentAccountDetails && order.paymentAccountDetails.length > 0 ? (
            order.paymentAccountDetails.map((detail) => (
              <div key={detail.method} className="rounded-lg border border-white/[0.06] bg-[#0b0e11] p-3">
                <div className="mb-2 text-xs font-bold text-primary">{detail.method}</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#848e9c]">Account Name</span>
                    <span className="text-[11px] font-semibold text-white">{detail.accountName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#848e9c]">
                      {detail.method === "Telebirr" ? "Phone Number" : "Account Number"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-white">{detail.accountNumber}</span>
                      {order.type === "buy" && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(detail.accountNumber);
                            setCopied(detail.method);
                            setTimeout(() => setCopied(null), 2000);
                          }}
                          className="flex items-center justify-center rounded-md bg-[#1e2329] p-1.5 text-[#848e9c] transition hover:bg-primary/20 hover:text-primary"
                          title="Copy"
                        >
                          {copied === detail.method ? <FiCheck size={11} className="text-green-400" /> : <FiCopy size={11} />}
                        </button>
                      )}
                    </div>
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
          <h3 className="text-sm font-bold mb-3">
            {order.type === "buy" ? "Upload Payment Proof" : "Merchant's Payment Proof"}
          </h3>
          {order.paymentProofUrl ? (
            <div className="space-y-3">
              <a href={order.paymentProofUrl} target="_blank" rel="noreferrer">
                <img src={order.paymentProofUrl} alt="Proof" className="w-full rounded-lg max-h-[300px] object-cover" />
              </a>
              <div className="text-center text-xs text-green-500 font-medium flex items-center justify-center gap-1">
                <FiCheck /> Proof Uploaded
              </div>
            </div>
          ) : order.type === "buy" ? (
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
          ) : (
            <div className="rounded-lg border border-dashed border-white/[0.06] py-6 text-center text-xs text-[#848e9c]">
              Waiting for merchant to upload proof of payment...
            </div>
          )}
        </div>

        {/* Actions */}
        {order.type === "buy" ? (
          // BUY ORDER ACTIONS
          order.status === "pending" && (
            <div className="flex gap-3">
              <button onClick={handleCancel} className="w-1/3 rounded-xl bg-[#2b3139] py-3 text-sm font-bold text-white transition hover:bg-[#3b4149]">
                Cancel
              </button>
              <button onClick={handleMarkPaid} className="w-2/3 rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90">
                I Have Paid
              </button>
            </div>
          )
        ) : (
          // SELL ORDER ACTIONS
          <div className="flex flex-col gap-3">
            {order.status === "pending" && (
              <button disabled className="w-full rounded-xl bg-[#2b3139] py-3 text-sm font-bold text-[#848e9c] opacity-70">
                Waiting for Merchant to Pay...
              </button>
            )}
            {order.status === "paid" && (
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you have received the ETB in your bank account? Releasing crypto cannot be undone!")) return;
                  try {
                    const token = await getAuth().currentUser?.getIdToken();
                    const res = await fetch("/api/p2p/release-usdt", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ orderId }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to release");
                    showToast("Crypto released successfully! ✅");
                  } catch (err: any) {
                    console.error(err);
                    showToast(err.message || "Failed to release crypto.", "error");
                  }
                }}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90"
              >
                Confirm Payment & Release Crypto
              </button>
            )}
          </div>
        )}

        {/* Appeal Action */}
        {(order.status === "paid" || order.status === "pending" || order.status === "appealed") && (
          <button
            onClick={() => setAppealOpen(true)}
            disabled={order.status === "appealed"}
            className="w-full mt-3 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {order.status === "appealed" ? "Order is under appeal" : "Appeal Order"}
          </button>
        )}

        {/* Admin/Merchant Actions */}
        {order.status === "paid" && isAdminOrMerchant && (
          <button
            onClick={async () => {
              await updateDoc(doc(getClientFirestore(), "p2pOrders", orderId), { status: "completed" });
              showToast("USDT released! Order completed. ✅");
            }}
            className="w-full rounded-xl bg-green-500 py-4 text-sm font-bold text-white transition hover:bg-green-600"
          >
            Release {order.amountUSDT} USDT
          </button>
        )}

      </main>

      {/* Chat Drawer */}
      {chatOpen && <ChatDrawer orderId={orderId} onClose={() => setChatOpen(false)} messages={messages} user={user} showToast={showToast} />}

      {/* Appeal Modal */}
      {appealOpen && <AppealModal order={order} user={user} onClose={() => setAppealOpen(false)} showToast={showToast} />}
    </div>
  );
}

// Subcomponent for Chat
function ChatDrawer({ orderId, onClose, messages, user, showToast }: { orderId: string; onClose: () => void; messages: P2PMessage[]; user: any; showToast: (msg: string, type?: "success" | "error") => void }) {
  const [text, setText] = useState("");
  const [sendingImg, setSendingImg] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSendingImg(true);

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64,
          folder: `korixa/p2p/${orderId}/chat`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await addDoc(collection(getClientFirestore(), `p2pOrders/${orderId}/messages`), {
        senderId: user.uid,
        senderName: user.email?.split("@")[0] || "User",
        text: "📷 Payment screenshot",
        imageUrl: data.url,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Chat image upload failed", err);
      showToast("Failed to send image. Please try again.", "error");
    } finally {
      setSendingImg(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0e11]">
      {/* Image Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreviewImg(null)}
        >
          <img src={previewImg} alt="Preview" className="max-h-full max-w-full rounded-xl object-contain" />
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setPreviewImg(null)}
          >
            <FiX size={20} />
          </button>
        </div>
      )}

      <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#161a1e] px-4 py-4">
        <h2 className="font-bold">Order Chat</h2>
        <button onClick={onClose} className="p-2 text-[#848e9c] transition hover:text-white">
          <FiX size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#848e9c]">
            <FiMessageSquare size={32} className="mb-3 opacity-40" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1 opacity-60">You can share payment screenshots here.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.senderId === user?.uid ? "items-end" : "items-start"}`}>
            <span className="mb-1 text-[10px] text-[#848e9c]">{m.senderName}</span>
            {m.imageUrl ? (
              <div
                className={`max-w-[72%] cursor-pointer overflow-hidden rounded-2xl border ${m.senderId === user?.uid ? "border-primary/30" : "border-white/[0.08]"}`}
                onClick={() => setPreviewImg(m.imageUrl!)}
              >
                <img
                  src={m.imageUrl}
                  alt="Payment screenshot"
                  className="w-full object-cover"
                  style={{ maxHeight: 220 }}
                />
              </div>
            ) : (
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.senderId === user?.uid ? "bg-primary text-[#0b0e11]" : "bg-[#1e2329] text-white"}`}>
                {m.text}
              </div>
            )}
            <span className="mt-1 text-[9px] text-[#848e9c]/60">
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/[0.06] bg-[#161a1e] px-3 py-3">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Gallery icon — left of input, opposite Send */}
          <label
            className={`flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition ${
              sendingImg
                ? "bg-primary/20 text-primary cursor-not-allowed"
                : "bg-[#0b0e11] text-[#848e9c] hover:bg-[#1e2329] hover:text-primary"
            }`}
          >
            {sendingImg ? (
              <FiLoader size={20} className="animate-spin" />
            ) : (
              <FiImage size={20} />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={sendingImg}
              onChange={handleImageUpload}
            />
          </label>

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-white/[0.06] bg-[#0b0e11] px-4 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex-shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-[#0b0e11] disabled:opacity-40 transition"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
