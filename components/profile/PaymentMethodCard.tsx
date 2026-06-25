"use client";

import { useState } from "react";
import { FiEdit2, FiTrash2, FiCheckCircle, FiPower, FiStar } from "react-icons/fi";
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
  // Mask account/phone number
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
      className={`relative overflow-hidden rounded-2xl border ${method.isDefault ? 'border-primary/50 bg-primary/5' : 'border-white/[0.06] bg-[#161a1e]'} p-4 transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Bank Icon Placeholder */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getBankColor(method.type)} text-white font-bold text-lg shadow-lg`}>
            {getBankName(method).charAt(0)}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-white">{getBankName(method)}</h3>
              {method.isDefault && (
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Default
                </span>
              )}
              {!method.isActive && (
                <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Disabled
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-[#848e9c]">{method.accountHolderName}</p>
            <p className="text-[14px] font-semibold text-white tracking-wider mt-0.5">{maskedIdentifier}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/[0.04] pt-3">
        {!method.isDefault && method.isActive && (
          <button 
            onClick={() => onSetDefault(method)}
            className="flex min-w-[52px] min-h-[32px] items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-3 text-[12px] font-medium text-[#848e9c] hover:bg-white/[0.08] hover:text-white transition"
          >
            <FiStar size={14} /> Default
          </button>
        )}
        
        <button 
          onClick={() => onToggleActive(method)}
          className={`flex min-w-[52px] min-h-[32px] items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-3 text-[12px] font-medium transition ${method.isActive ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
        >
          <FiPower size={14} /> {method.isActive ? 'Disable' : 'Enable'}
        </button>

        <button 
          onClick={() => onEdit(method)}
          className="flex min-w-[52px] min-h-[32px] items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-3 text-[12px] font-medium text-blue-400 hover:bg-blue-400/10 transition"
        >
          <FiEdit2 size={14} /> Edit
        </button>

        <button 
          onClick={() => onDelete(method)}
          className="flex min-w-[52px] min-h-[32px] items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] px-3 text-[12px] font-medium text-red-400 hover:bg-red-400/10 transition"
        >
          <FiTrash2 size={14} /> Delete
        </button>
      </div>
    </motion.div>
  );
}
