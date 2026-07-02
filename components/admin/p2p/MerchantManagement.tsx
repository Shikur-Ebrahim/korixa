"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FiPlus, FiTrash2, FiCheck, FiX, FiEdit2 } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import type { P2PMerchant, PaymentMethod } from "@/lib/p2p/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

const blankForm = (): Partial<P2PMerchant> & { seedTotalOrders?: number; seedCompletionRate?: number } => ({
  name: "",
  isVerified: true,
  completionRate: 100,
  totalOrders: 0,
  seedTotalOrders: 0,
  seedCompletionRate: 100,
  availableUSDT: 0,
  supportedPaymentMethods: [],
  status: "active",
});

export function MerchantManagement() {
  const [merchants, setMerchants] = useState<P2PMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<P2PMerchant> & { seedTotalOrders?: number; seedCompletionRate?: number }>(blankForm());

  useEffect(() => {
    const unsub = onSnapshot(collection(getClientFirestore(), "merchants"), (snap) => {
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMerchant)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowAdd(true);
  };

  const openEdit = (m: P2PMerchant) => {
    setEditingId(m.id);
    setForm({ ...m });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(blankForm());
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;

    try {
      if (editingId) {
        // On edit: only update name, USDT, status, paymentMethods
        // totalOrders & completionRate are auto-managed by real orders
        await updateDoc(doc(getClientFirestore(), "merchants", editingId), {
          name: form.name.trim(),
          isVerified: form.isVerified ?? true,
          availableUSDT: Number(form.availableUSDT) || 0,
          supportedPaymentMethods: form.supportedPaymentMethods ?? [],
          status: form.status ?? "active",
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new merchant — set seed values as the starting point
        const seedTotalOrders = Number((form as any).seedTotalOrders) || 0;
        const seedCompletionRate = Number((form as any).seedCompletionRate) || 100;
        // Calculate how many of the seed orders were "completed"
        const seedCompletedOrders = Math.round((seedCompletionRate / 100) * seedTotalOrders);

        const merchantId = `merchant_${Date.now()}`;
        await setDoc(doc(getClientFirestore(), "merchants", merchantId), {
          id: merchantId,
          name: form.name.trim(),
          isVerified: form.isVerified ?? true,
          // Display values = seed values initially
          totalOrders: seedTotalOrders,
          completionRate: seedCompletionRate,
          // Store seeds so real-order updates can add on top
          seedTotalOrders,
          seedCompletedOrders,
          availableUSDT: Number(form.availableUSDT) || 0,
          supportedPaymentMethods: form.supportedPaymentMethods ?? [],
          status: form.status ?? "active",
          createdAt: new Date().toISOString(),
        });
      }
      handleCancel();
    } catch (err) {
      console.error(err);
      alert("Failed to save merchant");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this merchant?")) return;
    await deleteDoc(doc(getClientFirestore(), "merchants", id)).catch(console.error);
  };

  const toggleMethod = (method: PaymentMethod) => {
    setForm((prev) => {
      const methods = prev.supportedPaymentMethods ?? [];
      return {
        ...prev,
        supportedPaymentMethods: methods.includes(method)
          ? methods.filter((m) => m !== method)
          : [...methods, method],
      };
    });
  };

  if (loading) return <div className="py-8 text-center text-[#848e9c]">Loading merchants...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Merchants</h3>
        <button
          onClick={showAdd ? handleCancel : openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90"
        >
          {showAdd ? <FiX /> : <FiPlus />}
          {showAdd ? "Cancel" : "Add Merchant"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-primary">
              {editingId ? "✏️ Editing Merchant" : "➕ New Merchant"}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#848e9c]">Merchant Display Name</label>
            <input
              required
              type="text"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              placeholder="e.g. Crypto Trader"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Available USDT</label>
              <input
                type="number"
                value={form.availableUSDT ?? ""}
                onChange={(e) => setForm({ ...form, availableUSDT: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Status</label>
              <select
                value={form.status ?? "active"}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "suspended" })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Seed stats — only shown during creation */}
          {!editingId && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
              <p className="text-[10px] font-bold text-primary">📊 Initial Display Stats (set once at creation)</p>
              <p className="text-[10px] text-[#848e9c]">After creation, these numbers will auto-update with real orders.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#848e9c]">Starting Total Orders</label>
                  <input
                    type="number"
                    value={(form as any).seedTotalOrders ?? ""}
                    onChange={(e) => setForm({ ...form, seedTotalOrders: Number(e.target.value) } as any)}
                    className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    placeholder="e.g. 1240"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#848e9c]">Starting Completion Rate (%)</label>
                  <input
                    type="number"
                    max={100}
                    value={(form as any).seedCompletionRate ?? ""}
                    onChange={(e) => setForm({ ...form, seedCompletionRate: Number(e.target.value) } as any)}
                    className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    placeholder="e.g. 99.82"
                  />
                </div>
              </div>
            </div>
          )}

          {/* When editing, show live stats as read-only */}
          {editingId && (
            <div className="rounded-lg border border-white/[0.06] bg-[#0b0e11] p-3">
              <p className="text-[10px] font-bold text-[#848e9c] mb-2">📊 Live Stats (auto-updated by real orders)</p>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-[#848e9c]">Total Orders: </span>
                  <span className="font-bold text-white">{(form as any).totalOrders ?? 0}</span>
                </div>
                <div>
                  <span className="text-[#848e9c]">Completion Rate: </span>
                  <span className="font-bold text-white">{(form as any).completionRate ?? 100}%</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-xs text-[#848e9c]">Supported Payment Methods</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PAYMENT_METHODS.map((method) => {
                const active = form.supportedPaymentMethods?.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/[0.06] text-[#848e9c] hover:border-white/20"
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90"
          >
            {editingId ? "Save Changes" : "Save Merchant"}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {merchants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] py-10 text-center text-sm text-[#848e9c]">
            No merchants yet. Add one above.
          </div>
        ) : (
          merchants.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0b0e11] p-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{m.name}</span>
                  {m.isVerified && <FiCheck className="text-xs text-primary" />}
                  {m.status === "suspended" && (
                    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">INACTIVE</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-[#848e9c]">
                  <span>{m.availableUSDT} USDT</span>
                  <span>•</span>
                  <span>{m.completionRate}% completion</span>
                  <span>•</span>
                  <span>{m.totalOrders} orders</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.supportedPaymentMethods.map((pm) => (
                    <span key={pm} className="rounded bg-[#1e2329] px-1.5 py-0.5 text-[9px] text-[#848e9c]">
                      {pm}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(m)}
                  className="rounded-lg p-2 text-[#848e9c] transition hover:bg-white/[0.06] hover:text-white"
                  title="Edit merchant"
                >
                  <FiEdit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
                  title="Delete merchant"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
