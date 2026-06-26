"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { getClientFirestore } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiCheckCircle, FiXCircle, FiEye, FiX } from "react-icons/fi";
import type { P2PAppeal } from "@/lib/p2p/types";

export function AppealManagement() {
  const { user } = useAuth();
  const [appeals, setAppeals] = useState<P2PAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<P2PAppeal | null>(null);

  useEffect(() => {
    const q = query(collection(getClientFirestore(), "p2pAppeals"));
    const unsub = onSnapshot(q, (snap) => {
      setAppeals(snap.docs.map(d => ({ id: d.id, ...d.data() } as P2PAppeal)).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (appealId: string, orderId: string, action: "force_complete" | "cancel_order") => {
    const actionName = action === "force_complete" ? "Release Crypto to Buyer" : "Cancel Order (Return Crypto to Seller)";
    if (!window.confirm(`Are you sure you want to ${actionName}? This cannot be undone.`)) return;

    try {
      const db = getClientFirestore();
      
      // Update order status
      const newOrderStatus = action === "force_complete" ? "completed" : "cancelled";
      await updateDoc(doc(db, "p2pOrders", orderId), { status: newOrderStatus });

      // Update appeal status
      await updateDoc(doc(db, "p2pAppeals", appealId), {
        status: action === "force_complete" ? "approved" : "rejected",
        resolutionNotes: `Admin ${user?.email} executed: ${actionName}`,
        resolvedAt: new Date().toISOString()
      });

      // Audit Log
      await addDoc(collection(db, "activityLogs"), {
        adminId: user?.uid,
        adminEmail: user?.email,
        action: `p2p_appeal_${action}`,
        appealId,
        orderId,
        timestamp: new Date().toISOString()
      });

      alert("Appeal resolved successfully.");
      setSelectedAppeal(null);
    } catch (e: any) {
      alert("Failed to resolve appeal: " + e.message);
    }
  };

  if (loading) return <div className="py-12 text-center text-sm text-[#848e9c]">Loading appeals...</div>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#161a1e] text-[#848e9c]">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {appeals.map(a => (
              <tr key={a.id} className="transition hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.orderId.slice(0, 8)}...</td>
                <td className="px-4 py-3">{a.reason}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    a.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                    a.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelectedAppeal(a)} className="rounded bg-[#2b3139] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#333a43]">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appeals.length === 0 && <div className="py-12 text-center text-[#848e9c]">No appeals found.</div>}
      </div>

      {selectedAppeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-[#1e2329] border border-white/[0.08] shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06] shrink-0">
              <h2 className="text-lg font-bold">Review Appeal</h2>
              <button onClick={() => setSelectedAppeal(null)} className="text-[#848e9c] hover:text-white"><FiX size={20} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#848e9c]">Order ID</label>
                  <p className="font-mono text-sm break-all">{selectedAppeal.orderId}</p>
                </div>
                <div>
                  <label className="text-xs text-[#848e9c]">Reason</label>
                  <p className="text-sm font-bold text-red-400">{selectedAppeal.reason}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-[#848e9c]">Description</label>
                <div className="mt-1 rounded-xl bg-[#0b0e11] p-3 text-sm">{selectedAppeal.description}</div>
              </div>

              <div>
                <label className="text-xs text-[#848e9c] mb-2 block">Evidence ({selectedAppeal.evidenceUrls?.length || 0})</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedAppeal.evidenceUrls?.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg border border-white/[0.06] overflow-hidden hover:border-primary transition">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>

              {(selectedAppeal.status === "approved" || selectedAppeal.status === "rejected") && selectedAppeal.resolutionNotes && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                  <label className="text-xs text-green-500 font-bold">Resolution Notes</label>
                  <p className="text-sm text-green-200 mt-1">{selectedAppeal.resolutionNotes}</p>
                </div>
              )}
            </div>

            {selectedAppeal.status === "pending" && (
              <div className="p-4 border-t border-white/[0.06] flex gap-3 shrink-0">
                <button
                  onClick={() => handleAction(selectedAppeal.id, selectedAppeal.orderId, "cancel_order")}
                  className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 transition"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => handleAction(selectedAppeal.id, selectedAppeal.orderId, "force_complete")}
                  className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-bold text-[#0b0e11] hover:bg-green-600 transition"
                >
                  Force Release Crypto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
