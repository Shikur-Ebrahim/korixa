"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from "firebase/firestore";
import { FiPlus, FiTrash2, FiX, FiEdit2, FiInfo } from "react-icons/fi";
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
    timeLimit: 15,
  };
}

export function AdvertisementManagement() {
  const [ads, setAds] = useState<P2PAdvertisement[]>([]);
  const [merchants, setMerchants] = useState<P2PMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowAdd(true);
  };

  const openEdit = (ad: P2PAdvertisement) => {
    setEditingId(ad.id);
    setForm({ ...ad });
    setShowAdd(true);
  };

  const handleCancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(blankForm());
  };

  const isBuyAd = form.type === "buy"; // User BUYS from merchant → merchant needs payment account details

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

    // For buy ads, all account details must be filled in
    if (isBuyAd) {
      const incomplete = (form.paymentAccountDetails ?? []).some(
        (d) => !d.accountName.trim() || !d.accountNumber.trim()
      );
      if (incomplete) { alert("Please fill in all payment account details"); return; }
    }

    const merchant = merchants.find((m) => m.id === form.merchantId);
    if (!merchant) return;

    const adPayload = {
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
      // For sell ads (user sells USDT to merchant), no payment account details needed
      paymentAccountDetails: isBuyAd ? (form.paymentAccountDetails ?? []) : [],
      timeLimit: Number(form.timeLimit) || 15,
      status: (form.status ?? "active") as "active" | "disabled" | "paused",
    };

    try {
      if (editingId) {
        await updateDoc(doc(getClientFirestore(), "p2pAdvertisements", editingId), {
          ...adPayload,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const adId = `ad_${Date.now()}`;
        await setDoc(doc(getClientFirestore(), "p2pAdvertisements", adId), {
          ...adPayload,
          id: adId,
          createdAt: new Date().toISOString(),
        });
      }
      handleCancel();
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
          onClick={showAdd ? handleCancel : openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90"
        >
          {showAdd ? <FiX /> : <FiPlus />}
          {showAdd ? "Cancel" : "Create Ad"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-white/[0.06] bg-[#0b0e11] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary">
              {editingId ? "✏️ Editing Advertisement" : "➕ New Advertisement"}
            </span>
          </div>

          {/* Ad Type Selection — prominent */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-[#848e9c]">Ad Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(prev => ({
                  ...prev,
                  type: "buy",
                  paymentAccountDetails: (prev.paymentMethods ?? []).map(m => ({
                    method: m,
                    accountName: (prev.paymentAccountDetails ?? []).find(d => d.method === m)?.accountName ?? "",
                    accountNumber: (prev.paymentAccountDetails ?? []).find(d => d.method === m)?.accountNumber ?? "",
                  }))
                }))}
                className={`rounded-xl border p-3 text-left transition ${
                  form.type === "buy"
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/[0.06] bg-[#1e2329] hover:bg-[#2b3139]"
                }`}
              >
                <div className={`text-sm font-bold ${form.type === "buy" ? "text-green-400" : "text-white"}`}>Buy Ad</div>
                <div className="mt-1 text-[10px] text-[#848e9c]">User buys USDT from merchant</div>
              </button>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type: "sell", paymentAccountDetails: [] }))}
                className={`rounded-xl border p-3 text-left transition ${
                  form.type === "sell"
                    ? "border-red-500 bg-red-500/10"
                    : "border-white/[0.06] bg-[#1e2329] hover:bg-[#2b3139]"
                }`}
              >
                <div className={`text-sm font-bold ${form.type === "sell" ? "text-red-400" : "text-white"}`}>Sell Ad</div>
                <div className="mt-1 text-[10px] text-[#848e9c]">User sells USDT to merchant</div>
              </button>
            </div>
          </div>

          {/* Info Banner depending on type */}
          <div className={`flex items-start gap-2 rounded-lg p-3 text-[10px] ${
            isBuyAd ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
          }`}>
            <FiInfo size={12} className={`mt-0.5 shrink-0 ${isBuyAd ? "text-green-400" : "text-red-400"}`} />
            <span className={isBuyAd ? "text-green-300" : "text-red-300"}>
              {isBuyAd
                ? "You are creating a BUY ad. Users will pay ETB to buy USDT. Enter your payment account details so users know where to send money."
                : "You are creating a SELL ad. Users will send USDT and receive ETB. Select the payment methods you accept — no account details needed here."}
            </span>
          </div>

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
                  ...(merchant && !editingId ? {
                    availableUSDT: merchant.availableUSDT,
                    paymentMethods: merchant.supportedPaymentMethods || [],
                    paymentAccountDetails: isBuyAd
                      ? (merchant.supportedPaymentMethods || []).map(method => ({
                          method, accountName: "", accountNumber: ""
                        }))
                      : [],
                  } : {}),
                }));
              }}
              className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="">-- Choose Merchant --</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Price + USDT + Limits */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Price (ETB per USDT)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="e.g. 145.50"
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
                placeholder="e.g. 5000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Min Order (ETB)</label>
              <input
                required
                type="number"
                value={form.minOrderLimit || ""}
                onChange={(e) => setForm({ ...form, minOrderLimit: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Max Order (ETB)</label>
              <input
                required
                type="number"
                value={form.maxOrderLimit || ""}
                onChange={(e) => setForm({ ...form, maxOrderLimit: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Time Limit (minutes)</label>
              <select
                value={form.timeLimit ?? 15}
                onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#848e9c]">Status</label>
              <select
                value={form.status ?? "active"}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "disabled" | "paused" })}
                className="w-full rounded-lg border border-white/[0.06] bg-[#1e2329] px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="mb-2 block text-xs text-[#848e9c]">
              {isBuyAd ? "Payment Methods & Account Details" : "Payment Methods You Accept"}
            </label>
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

            {/* Account detail fields — only for BUY ads */}
            {isBuyAd && (form.paymentAccountDetails ?? []).map((detail) => (
              <div key={detail.method} className="mb-3 rounded-lg border border-white/[0.06] bg-[#1e2329] p-3 space-y-2">
                <div className="text-xs font-semibold text-primary">{detail.method}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] text-[#848e9c]">Account Holder Name</label>
                    <input
                      required={isBuyAd}
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
                      required={isBuyAd}
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

            {/* Sell ad explanation */}
            {!isBuyAd && (form.paymentMethods ?? []).length > 0 && (
              <div className="rounded-lg bg-[#1e2329] border border-white/[0.06] p-3 text-[10px] text-[#848e9c]">
                ✅ Users will select one of these methods to receive their ETB payment when they sell USDT.
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`w-full rounded-xl py-3 text-sm font-bold transition ${
              isBuyAd
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {editingId
              ? "Save Changes"
              : isBuyAd
                ? "✅ Create Buy Ad (Users can Buy USDT)"
                : "✅ Create Sell Ad (Users can Sell USDT)"}
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
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      ad.type === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {ad.type === "buy" ? "BUY AD (Users Buy)" : "SELL AD (Users Sell)"}
                    </span>
                    <span className="font-semibold text-white text-sm">{ad.price} ETB</span>
                    {(ad.status === "disabled" || ad.status === "paused") && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                        {ad.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] text-[#848e9c]">
                    {ad.merchantName} • {ad.availableUSDT} USDT • {ad.minOrderLimit}–{ad.maxOrderLimit} ETB
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ad.paymentMethods.map((m) => (
                      <span key={m} className="rounded bg-[#1e2329] px-1.5 py-0.5 text-[9px] text-[#848e9c]">{m}</span>
                    ))}
                  </div>
                  {ad.type === "buy" && ad.paymentAccountDetails?.length > 0 && (
                    <div className="mt-1 text-[9px] text-primary">
                      ✓ {ad.paymentAccountDetails.length} account detail(s) configured
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(ad)}
                    className="rounded-lg p-2 text-[#848e9c] transition hover:bg-white/[0.06] hover:text-white"
                    title="Edit advertisement"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm("Delete this ad?")) {
                        await deleteDoc(doc(getClientFirestore(), "p2pAdvertisements", ad.id));
                      }
                    }}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10"
                    title="Delete advertisement"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
