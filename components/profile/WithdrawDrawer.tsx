"use client";

import { FiUpload, FiCreditCard, FiX, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface WithdrawDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function WithdrawDrawer({ open, onClose }: WithdrawDrawerProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="animate-slide-up w-full rounded-t-3xl bg-[#161a1e] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Select withdraw method</h2>
          <button onClick={onClose} className="p-1 text-[#848e9c] hover:text-white transition">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Crypto Withdrawal */}
          <button
            onClick={() => {
              onClose();
              router.push("/profile/withdraw/crypto");
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.04]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2329] text-white">
                <FiUpload size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Crypto withdrawal</p>
                <p className="text-[11px] text-[#848e9c] mt-0.5">On-chain withdrawal | Korixa UID/email/mobile number</p>
              </div>
            </div>
            <FiArrowRight size={16} className="text-[#848e9c]" />
          </button>

          {/* Fiat Withdrawal */}
          <button
            onClick={() => {
              onClose();
              router.push("/profile/withdraw/fiat");
            }}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition border border-white/[0.04]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2329] text-white">
                <FiCreditCard size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Sell for ETB</p>
                <p className="text-[11px] text-[#848e9c] mt-0.5">Receive cash instantly in your bank account or e-wallet</p>
              </div>
            </div>
            <FiArrowRight size={16} className="text-[#848e9c]" />
          </button>
        </div>
      </div>
    </div>
  );
}
