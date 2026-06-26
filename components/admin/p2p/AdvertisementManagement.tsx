"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { getClientFirestore } from "@/lib/firebase";
import type { P2PAdvertisement, P2PMerchant, PaymentMethod, PaymentAccountDetail } from "@/lib/p2p/types";

const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "Telebirr",
  "CBE",
  "Awash Bank",
  "Dashen Bank",
  "Bank of Abyssinia",
];

const accountLabel: Record<PaymentMethod, string> = {
  "Telebirr": "Phone Number",
  "CBE": "Account Number",
  "Awash Bank": "Account Number",
  "Dashen Bank": "Account Number",
  "Bank of Abyssinia": "Account Number",
};

function blankForm(): Partial<P2PAdvertisement> {
  return {
    type: "buy",
    currency: "ETB",
    price: 0,
    availableUSDT: 0,
    minOrderLimit: 0,
    maxOrderLimit: 0,
    paymentMethods: [],
    paymentAccountDetails: [],
    status: "active",
  };
}

export function AdvertisementManagement() {
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [merchants, setMerchants] = useState<P2PMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<P2PAdvertisement>>(blankForm());

  useEffect(() => {
    getDocs(collection(getClientFirestore(), "merchants")).then((snap) =>
      setMerchants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PMerchant)))
    );

    const unsub = onSnapshot(collection(getClientFirestore(), "p2pAdvertisements"), (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() } as P2PAdvertisement)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const togglePaymentMethod = (method: PaymentMethod) => {
    setForm((prev) => {
      const methods = prev.paymentMethods ?? [];
      const details = prev.paymentAccountDetails ?? [];
      if (methods.includes(method)) {
        return {
          ...prev,
          paymentMethods: methods.filter((m) => m !== method),
          paymentAccountDetails: details.filter((d) => d.method !== method),
        };
      } else {
        return {
          ...prev,
          paymentMethods: [...methods, method],
          paymentAccountDetails: [...details, { method, accountName: "", accountNumber: "" }],
        };
      }
    });
  };

  const updateAccountDetail = (method: PaymentMethod, field: "accountName" | "accountNumber", value: string) => {
    setForm((prev) => ({
      ...prev,
      paymentAccountDetails: (prev.paymentAccountDetails ?? []).map((d) =>
        d.method === method ? { ...d, [field]: value } : d
      ),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.merchantId) { alert("Please select a merchant"); return; }
    if (!form.paymentMethods?.length) { alert("Please select at least one payment method"); return; }

    const merchant = merchants.find((m) => m.id === form.merchantId);
    if (!merchant) return;

    try {
      const adId = `ad_${Date.now()}`;
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
        paymentMethods: form.paymentMethods ?? [],
        paymentAccountDetails: form.paymentAccountDetails ?? [],
        timeLimit: 15,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(getClientFirestore(), "p2pAdvertisements", adId), adData);
      setShowAdd(false);
      setForm(blankForm());
    } catch (err) {
      console.error(err);
      alert("Failed to save ad");
    }
  };

  if (loading) return <div className="py-8 text-center text-[#848e9c]">Loading...</div>;

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
        <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4">
          {/* Merchant */}
          <div>
            <label className="mb-1 block text-xs text-[#848e9c]">Select Merchant</label>
            <select
              required
              value={form.merchantId ?? ""}
              onChange={(e) => {
                const mId = e.target.value;
                const merchant = merchants.find((m) => m.id === mId);
                setForm((prev) => ({
                  ...prev,
                  merchantId: mId,
                  ...(merchant ? {
                    availableUSDT: merchant.availableUSDT,
                    paymentMethods: merchant.supportedPaymentMethods || [],
                    paymentAccountDetails: (merchant.supportedPaymentMethods || []).map(method => ({
                      method, accountName: "", accountNumber: ""
                    }))
                  } : {})
                }));
              }}
              className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="">-- Choose Merchant --</option>
              {merchants
                .filter(m => !ads.some(ad => ad.merchantId === m.id && ad.type === form.type))
                .map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Type + Price */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Type</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const newType = e.target.value as "buy" | "sell";
                  setForm(prev => {
                    const isInvalid = prev.merchantId && ads.some(ad => ad.merchantId === prev.merchantId && ad.type === newType);
                    return { ...prev, type: newType, merchantId: isInvalid ? "" : prev.merchantId };
                  });
                }}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="buy">User buys USDT</option>
                <option value="sell">User sells USDT</option>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-[#848e9c]">Min ETB</label>
                <input
                  required
                  type="number"
                  value={form.minOrderLimit || ""}
                  onChange={(e) => setForm({ ...form, minOrderLimit: Number(e.target.value) })}
                  className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
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

          {/* Payment Methods */}
          <div>
            <label className="mb-2 block text-xs text-[#848e9c]">Payment Methods & Account Details</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {ALL_PAYMENT_METHODS.map((method) => {
                const active = form.paymentMethods?.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => togglePaymentMethod(method)}
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

            {/* Account detail fields for each selected method */}
            {(form.paymentAccountDetails ?? []).map((detail) => (
              <div key={detail.method} className="mb-3 rounded-lg border border-white/[0.06] bg-[#1e2329] p-3 space-y-2">
                <div className="text-xs font-semibold text-primary">{detail.method}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848e9c]">Account Holder Name</label>
                    <input
                      required
                      type="text"
                      value={detail.accountName}
                      onChange={(e) => updateAccountDetail(detail.method, "accountName", e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded border border-white/[0.06] bg-[#0b0e11] px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848e9c]">{accountLabel[detail.method]}</label>
                    <input
                      required
                      type="text"
                      value={detail.accountNumber}
                      onChange={(e) => updateAccountDetail(detail.method, "accountNumber", e.target.value)}
                      placeholder={detail.method === "Telebirr" ? "09xxxxxxxx" : "Account number"}
                      className="w-full rounded border border-white/[0.06] bg-[#0b0e11] px-2.5 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90"
          >
            Create Advertisement
          </button>
        </form>
      )}

      {/* Ads List */}
      <div className="space-y-2">
        {ads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] py-10 text-center text-sm text-[#848e9c]">
            No ads yet. Create one above.
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${ad.type === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {ad.type === "buy" ? "USER BUYS" : "USER SELLS"}
                    </span>
                    <span className="font-semibold text-white">{ad.price} ETB</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#848e9c]">
                    {ad.merchantName} • {ad.availableUSDT} USDT • {ad.minOrderLimit}–{ad.maxOrderLimit} ETB
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ad.paymentMethods.map((m) => (
                      <span key={m} className="rounded bg-[#1e2329] px-1.5 py-0.5 text-[9px] text-[#848e9c]">{m}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (confirm("Delete this ad?")) {
                      await deleteDoc(doc(getClientFirestore(), "p2pAdvertisements", ad.id));
                    }
                  }}
                  className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
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
