"use client";

import { useState } from "react";
import { FiX, FiUploadCloud, FiLoader, FiAlertCircle } from "react-icons/fi";
import { doc, collection, addDoc, updateDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import type { P2POrder, AppealReason } from "@/lib/p2p/types";

const REASONS: AppealReason[] = [
  "Payment Completed",
  "Seller Not Responding",
  "Incorrect Amount",
  "Fraud Suspicion",
  "Other"
];

export function AppealModal({
  order,
  user,
  onClose,
  showToast
}: {
  order: P2POrder;
  user: any;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}) {
  const [reason, setReason] = useState<AppealReason>("Payment Completed");
  const [description, setDescription] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file: base64,
          folder: `korixa/p2p/appeals/${order.id}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setEvidenceUrls(prev => [...prev, data.url]);
      showToast("Evidence uploaded");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload evidence", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) return showToast("Description is required", "error");
    if (evidenceUrls.length === 0) return showToast("At least one piece of evidence is required", "error");
    
    setSubmitting(true);
    try {
      const db = getClientFirestore();
      
      await addDoc(collection(db, "p2pAppeals"), {
        orderId: order.id,
        buyerId: order.buyerId,
        sellerId: order.merchantId,
        creatorId: user.uid,
        reason,
        description,
        evidenceUrls,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "p2pOrders", order.id), { status: "appealed" });

      showToast("Your appeal has been submitted successfully.");
      onClose();
    } catch (err: any) {
      showToast("Failed to submit appeal: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#1e2329] rounded-t-3xl p-5 animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col">
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-white/20" />
        
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FiAlertCircle className="text-red-400" />
            File an Appeal
          </h3>
          <button onClick={onClose} className="p-2 -mr-2 text-[#848e9c] hover:text-white transition rounded-full">
            <FiX size={20} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-5 px-1 pb-4">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200 leading-relaxed">
            Appeals freeze the order until our support team reviews the case. False appeals may result in account suspension.
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#848e9c]">Reason for Appeal</label>
            <div className="grid grid-cols-1 gap-2">
              {REASONS.map(r => (
                <label key={r} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${reason === r ? "border-primary bg-primary/10" : "border-white/[0.06] bg-[#0b0e11] hover:border-white/20"}`}>
                  <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${reason === r ? "border-primary" : "border-[#848e9c]"}`}>
                    {reason === r && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className={`text-sm font-medium ${reason === r ? "text-primary" : "text-white"}`}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#848e9c]">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Please provide detailed information about the dispute..."
              rows={4}
              className="w-full rounded-xl bg-[#0b0e11] px-4 py-3 text-sm text-white placeholder:text-[#848e9c] border border-white/[0.06] focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#848e9c]">Evidence (Required)</label>
            <div className="grid grid-cols-3 gap-2">
              {evidenceUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg border border-white/[0.06] overflow-hidden bg-[#0b0e11]">
                  <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                  <button onClick={() => setEvidenceUrls(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white">
                    <FiX size={12} />
                  </button>
                </div>
              ))}
              {evidenceUrls.length < 3 && (
                <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition ${uploading ? "border-primary/40 text-primary" : "border-white/[0.2] text-[#848e9c] hover:border-primary hover:text-primary"} bg-[#0b0e11]`}>
                  {uploading ? <FiLoader size={20} className="animate-spin" /> : <FiUploadCloud size={20} />}
                  <span className="text-[10px] mt-1">Upload</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting || uploading}
            className="w-full rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Appeal"}
          </button>
        </div>
      </div>
    </div>
  );
}
