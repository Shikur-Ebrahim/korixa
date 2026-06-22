"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import type { P2PMerchant, PaymentMethod } from "@/lib/p2p/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

export function MerchantManagement() {
  const [merchants, setMerchants] = useState<P2PMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<P2PMerchant>>({
    name: "",
    isVerified: true,
    completionRate: 100,
    totalOrders: 0,
    availableUSDT: 0,
    supportedPaymentMethods: [],
    status: "active",
  });

  useEffect(() => {
    const q = query(collection(getClientFirestore(), "merchants"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMerchant));
      setMerchants(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name) return;

    try {
      const merchantData: P2PMerchant = {
        id: form.id,
        name: form.name,
        isVerified: form.isVerified ?? true,
        completionRate: Number(form.completionRate) || 0,
        totalOrders: Number(form.totalOrders) || 0,
        availableUSDT: Number(form.availableUSDT) || 0,
        supportedPaymentMethods: form.supportedPaymentMethods ?? [],
        status: form.status ?? "active",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(getClientFirestore(), "merchants", form.id), merchantData);
      setShowAdd(false);
      setForm({
        name: "",
        isVerified: true,
        completionRate: 100,
        totalOrders: 0,
        availableUSDT: 0,
        supportedPaymentMethods: [],
        status: "active",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save merchant");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this merchant?")) return;
    try {
      await deleteDoc(doc(getClientFirestore(), "merchants", id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete merchant");
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setForm((prev) => {
      const methods = prev.supportedPaymentMethods || [];
      if (methods.includes(method)) {
        return { ...prev, supportedPaymentMethods: methods.filter((m) => m !== method) };
      } else {
        return { ...prev, supportedPaymentMethods: [...methods, method] };
      }
    });
  };

  if (loading) return <div className="py-8 text-center text-[#848e9c]">Loading merchants...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Verified Merchants</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90"
        >
          {showAdd ? <FiX /> : <FiPlus />}
          {showAdd ? "Cancel" : "Add Merchant"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">User UID</label>
              <input
                required
                type="text"
                value={form.id || ""}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="Firebase UID"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Display Name</label>
              <input
                required
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="e.g. CryptoTrader"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-[#848e9c]">Supported Payment Methods</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PAYMENT_METHODS.map((method) => {
                const active = form.supportedPaymentMethods?.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => togglePaymentMethod(method)}
                    className={`rounded border px-2 py-1 text-xs transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/[0.06] text-[#848e9c] hover:border-white/[0.2]"
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
            className="w-full rounded-lg bg-primary py-2 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90"
          >
            Save Merchant
          </button>
        </form>
      )}

      <div className="space-y-2">
        {merchants.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] py-8 text-center text-sm text-[#848e9c]">
            No merchants found.
          </div>
        ) : (
          merchants.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0b0e11] p-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white">{m.name}</span>
                  {m.isVerified && <FiCheck className="text-xs text-primary" />}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#848e9c]">
                  <span>{m.totalOrders} Orders</span>
                  <span>•</span>
                  <span>{m.completionRate}% Completion</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
              >
                <FiTrash2 className="text-sm" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
