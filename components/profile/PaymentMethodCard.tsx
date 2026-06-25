"use client";

import { FiEdit2, FiTrash2, FiPower, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";
import { PaymentMethod } from "@/lib/profile/types";

interface Props {
  method: PaymentMethod;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (method: PaymentMethod) => void;
  onSetDefault: (method: PaymentMethod) => void;
  onToggleActive: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({ method, onEdit, onDelete, onSetDefault, onToggleActive }: Props) {
  const identifier = method.type === "telebirr" ? method.phoneNumber : method.accountNumber;
  const maskedIdentifier = identifier ? `****${identifier.slice(-4)}` : "****";

  const getBankColor = (type: string) => {
    switch(type) {
      case "telebirr": return "bg-blue-500";
      case "cbe": return "bg-purple-600";
      case "awash": return "bg-blue-700";
      case "dashen": return "bg-yellow-600";
      case "abyssinia": return "bg-yellow-500";
      default: return "bg-gray-600";
    }
  };

  const getBankName = (method: PaymentMethod) => {
    switch(method.type) {
      case "telebirr": return "Telebirr";
      case "cbe": return "Commercial Bank of Ethiopia";
      case "awash": return "Awash Bank";
      case "dashen": return "Dashen Bank";
      case "abyssinia": return "Bank of Abyssinia";
      default: return method.bankName || "Bank Transfer";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border ${method.isDefault ? 'border-primary/50 bg-primary/5' : 'border-white/[0.06] bg-[#161a1e]'} p-5 transition-all`}
    >
      <div className="flex items-start gap-4">
        {/* Bank Icon */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${getBankColor(method.type)} text-white font-bold text-xl shadow-lg`}>
          {getBankName(method).charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[18px] font-bold text-white">{getBankName(method)}</h3>
            {method.isDefault && (
              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                Default
              </span>
            )}
            {!method.isActive && (
              <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-500">
                Disabled
              </span>
            )}
          </div>
          <p className="mt-1 text-[15px] text-[#848e9c]">{method.accountHolderName}</p>
          <p className="text-[17px] font-semibold text-white tracking-widest mt-1">{maskedIdentifier}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.04] pt-4">
        {!method.isDefault && method.isActive && (
          <button 
            onClick={() => onSetDefault(method)}
            className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] px-2 text-[14px] font-semibold text-[#848e9c] hover:bg-white/[0.08] hover:text-white transition"
          >
            <FiStar size={15} /> Default
          </button>
        )}
        
        <button 
          onClick={() => onToggleActive(method)}
          className={`flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] px-2 text-[14px] font-semibold transition ${method.isActive ? 'text-yellow-400 hover:bg-yellow-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
        >
          <FiPower size={15} /> {method.isActive ? 'Disable' : 'Enable'}
        </button>

        <button 
          onClick={() => onEdit(method)}
          className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] px-2 text-[14px] font-semibold text-blue-400 hover:bg-blue-400/10 transition"
        >
          <FiEdit2 size={15} /> Edit
        </button>

        <button 
          onClick={() => onDelete(method)}
          className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] px-2 text-[14px] font-semibold text-red-400 hover:bg-red-400/10 transition"
        >
          <FiTrash2 size={15} /> Delete
        </button>
      </div>
    </motion.div>
  );
}
