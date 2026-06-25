"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { PaymentMethod, PaymentMethodType } from "@/lib/profile/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (method: Partial<PaymentMethod>) => Promise<void>;
  initialData?: PaymentMethod | null;
}

const PAYMENT_TYPES: { id: PaymentMethodType; label: string }[] = [
  { id: "telebirr", label: "Telebirr" },
  { id: "cbe", label: "Commercial Bank of Ethiopia (CBE)" },
  { id: "awash", label: "Awash Bank" },
  { id: "dashen", label: "Dashen Bank" },
  { id: "abyssinia", label: "Bank of Abyssinia" },
  { id: "other", label: "Other Local Bank" },
];

export function AddEditPaymentMethodModal({ isOpen, onClose, onSave, initialData }: Props) {
  const [type, setType] = useState<PaymentMethodType>("cbe");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setBankName(initialData.bankName || "");
        setAccountHolderName(initialData.accountHolderName);
        setAccountNumber(initialData.accountNumber || "");
        setPhoneNumber(initialData.phoneNumber || "");
      } else {
        // Reset
        setType("cbe");
        setBankName("");
        setAccountHolderName("");
        setAccountNumber("");
        setPhoneNumber("");
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isTelebirr = type === "telebirr";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        type,
        bankName: type === "other" ? bankName : "",
        accountHolderName,
        accountNumber: !isTelebirr ? accountNumber : "",
        phoneNumber: isTelebirr ? phoneNumber : "",
        isActive: initialData ? initialData.isActive : true,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save payment method.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-md bg-[#161a1e] rounded-t-2xl sm:rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm md:text-base font-bold text-white">
              {initialData ? "Edit Payment Method" : "Add Payment Method"}
            </h2>
            <button onClick={onClose} className="p-2 text-[#848e9c] hover:text-white transition rounded-full hover:bg-white/[0.06]">
              <FiX size={18} />
            </button>
          </div>

          <div className="px-4 py-4 overflow-y-auto flex-1">
            <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Payment Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold text-[#848e9c]">Payment Type</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTypeDropdownOpen(p => !p)}
                    className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0b0e11] px-4 py-3 text-xs md:text-sm font-medium text-white focus:border-primary focus:outline-none transition-all"
                  >
                    <span>{PAYMENT_TYPES.find(pt => pt.id === type)?.label ?? type}</span>
                    <svg className={`h-4 w-4 text-[#848e9c] transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>

                  {typeDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setTypeDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-white/[0.08] bg-[#1e2329] shadow-2xl overflow-hidden">
                        {PAYMENT_TYPES.map(pt => (
                          <button
                            key={pt.id}
                            type="button"
                            onClick={() => { setType(pt.id); setTypeDropdownOpen(false); }}
                            className={`flex w-full items-center justify-between px-4 py-3.5 text-xs md:text-sm font-medium transition-colors border-b border-white/[0.04] last:border-0 ${
                              pt.id === type ? "bg-primary/10 text-primary" : "text-white hover:bg-white/[0.06]"
                            }`}
                          >
                            {pt.label}
                            {pt.id === type && (
                              <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bank Name (only for 'other') */}
              {type === "other" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#848e9c]">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter full bank name"
                    className="w-full rounded-xl border border-white/[0.06] bg-[#0b0e11] px-3 py-3 text-xs md:text-sm font-medium text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
                    required
                  />
                </div>
              )}

              {/* Account Holder Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] md:text-xs font-semibold text-[#848e9c]">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Exact name on account"
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0b0e11] px-3 py-3 text-xs md:text-sm font-medium text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
                  required
                />
              </div>

              {/* Account/Phone Number */}
              {isTelebirr ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#848e9c]">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+251 911 234 567"
                    className="w-full rounded-xl border border-white/[0.06] bg-[#0b0e11] px-3 py-3 text-xs md:text-sm font-medium text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] md:text-xs font-semibold text-[#848e9c]">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank account number"
                    className="w-full rounded-xl border border-white/[0.06] bg-[#0b0e11] px-3 py-3 text-xs md:text-sm font-medium text-white focus:border-primary focus:outline-none transition-all placeholder:text-white/20"
                    required
                  />
                </div>
              )}

              {/* Warning box */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                <p className="text-[10px] md:text-xs text-yellow-500/90 leading-relaxed">
                  <strong>Important:</strong> The account holder name must match your verified Korixa KYC identity. Payments from third-party accounts will be rejected.
                </p>
              </div>

            </form>
          </div>

          <div className="px-4 py-4 border-t border-white/[0.06] bg-[#161a1e]">
            <button
              form="payment-form"
              type="submit"
              disabled={loading}
              className="w-full flex min-h-[48px] items-center justify-center rounded-xl bg-primary text-xs md:text-sm font-bold text-[#0b0e11] disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? "Saving..." : "Confirm"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
