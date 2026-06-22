"use client";

import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import type { P2PAdvertisement, P2PMerchant, PaymentMethod } from "@/lib/p2p/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

export function AdvertisementManagement() {
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [merchants, setMerchants] = useState<P2PMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<P2PAdvertisement>>({
    type: "buy",
    currency: "ETB",
    price: 0,
    availableUSDT: 0,
    minOrderLimit: 0,
    maxOrderLimit: 0,
    paymentMethods: [],
    status: "active",
  });

  useEffect(() => {
    // Load merchants first for the dropdown
    getDocs(collection(getClientFirestore(), "merchants")).then((snap) => {
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMerchant)));
    });

    const q = query(collection(getClientFirestore(), "p2pAdvertisements"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PAdvertisement));
      setAds(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.merchantId) {
      alert("Please select a merchant");
      return;
    }

    const merchant = merchants.find((m) => m.id === form.merchantId);
    if (!merchant) return;

    try {
      const adId = form.id || doc(collection(getClientFirestore(), "p2pAdvertisements")).id;
      
      const adData: P2PAdvertisement = {
        id: adId,
        merchantId: merchant.id,
        merchantName: merchant.name,
        merchantVerified: merchant.isVerified,
        merchantCompletionRate: merchant.completionRate,
        merchantTotalOrders: merchant.totalOrders,
        type: form.type as "buy" | "sell",
        currency: "ETB",
        price: Number(form.price),
        availableUSDT: Number(form.availableUSDT),
        minOrderLimit: Number(form.minOrderLimit),
        maxOrderLimit: Number(form.maxOrderLimit),
        paymentMethods: form.paymentMethods || [],
        status: form.status as "active" | "disabled",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(getClientFirestore(), "p2pAdvertisements", adId), adData);
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save ad");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      await deleteDoc(doc(getClientFirestore(), "p2pAdvertisements", id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete ad");
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setForm((prev) => {
      const methods = prev.paymentMethods || [];
      if (methods.includes(method)) {
        return { ...prev, paymentMethods: methods.filter((m) => m !== method) };
      } else {
        return { ...prev, paymentMethods: [...methods, method] };
      }
    });
  };

  if (loading) return <div className="py-8 text-center text-[#848e9c]">Loading ads...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Advertisements</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90"
        >
          {showAdd ? <FiX /> : <FiPlus />}
          {showAdd ? "Cancel" : "Create Ad"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[#848e9c]">Select Merchant</label>
            <select
              required
              value={form.merchantId || ""}
              onChange={(e) => setForm({ ...form, merchantId: e.target.value })}
              className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="">-- Choose Merchant --</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Type (User Action)</label>
              <select
                required
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "buy" | "sell" })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="buy">Buy USDT (Merchant sells)</option>
                <option value="sell">Sell USDT (Merchant buys)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Price (ETB per USDT)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Available USDT</label>
              <input
                required
                type="number"
                value={form.availableUSDT || ""}
                onChange={(e) => setForm({ ...form, availableUSDT: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="mb-1 block text-xs text-[#848e9c]">Min ETB</label>
                <input
                  required
                  type="number"
                  value={form.minOrderLimit || ""}
                  onChange={(e) => setForm({ ...form, minOrderLimit: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div className="w-1/2">
                <label className="mb-1 block text-xs text-[#848e9c]">Max ETB</label>
                <input
                  required
                  type="number"
                  value={form.maxOrderLimit || ""}
                  onChange={(e) => setForm({ ...form, maxOrderLimit: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-[#848e9c]">Accepted Payment Methods</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PAYMENT_METHODS.map((method) => {
                const active = form.paymentMethods?.includes(method);
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
            Create Advertisement
          </button>
        </form>
      )}

      <div className="space-y-2">
        {ads.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] py-8 text-center text-sm text-[#848e9c]">
            No ads found.
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0b0e11] p-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ad.type === "buy" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                    {ad.type.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-white">{ad.price} ETB</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#848e9c]">
                  <span>{ad.merchantName}</span>
                  <span>•</span>
                  <span>{ad.availableUSDT} USDT available</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(ad.id)}
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
