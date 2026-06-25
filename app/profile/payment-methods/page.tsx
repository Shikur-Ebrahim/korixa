"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { PaymentMethod } from "@/lib/profile/types";
import { 
  subscribePaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod, 
  setDefaultPaymentMethod 
} from "@/lib/profile/payment-methods-service";
import { PaymentMethodCard } from "@/components/profile/PaymentMethodCard";
import { AddEditPaymentMethodModal } from "@/components/profile/AddEditPaymentMethodModal";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const unsub = subscribePaymentMethods(user.uid, (data) => {
        setMethods(data);
        setLoading(false);
      });
      return () => unsub();
    } else {
      router.push("/sign-in");
    }
  }, [user, router]);

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const handleSaveMethod = async (methodData: Partial<PaymentMethod>) => {
    if (!user?.uid) return;
    
    if (editingMethod) {
      await updatePaymentMethod(user.uid, editingMethod.id, methodData);
    } else {
      await addPaymentMethod(user.uid, methodData as Omit<PaymentMethod, "id" | "uid" | "createdAt" | "updatedAt">);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!user?.uid) return;
    // Require confirmation before delete (Security Step)
    if (window.confirm(`Are you sure you want to delete ${method.type.toUpperCase()} payment method?`)) {
      await deletePaymentMethod(user.uid, method.id);
    }
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (!user?.uid) return;
    // Require confirmation before setting default (Security Step)
    if (window.confirm(`Are you sure you want to set this ${method.type.toUpperCase()} account as your default payment method?`)) {
      await setDefaultPaymentMethod(user.uid, method.id);
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    if (!user?.uid) return;
    const action = method.isActive ? "disable" : "enable";
    if (window.confirm(`Are you sure you want to ${action} this payment method?`)) {
      await updatePaymentMethod(user.uid, method.id, { isActive: !method.isActive });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] pb-safe flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0b0e11] px-4 pt-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition">
            <FiArrowLeft size={22} className="text-[#eaecef]" />
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-white tracking-tight">Payment Methods</h1>
            <p className="text-[14px] text-[#848e9c] mt-0.5">Manage payment methods for P2P trading.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        {loading ? (
          // Loading Skeletons
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 h-28" />
            ))}
          </div>
        ) : methods.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.02]">
              <FiPlus size={32} className="text-[#848e9c]" />
            </div>
            <h3 className="text-[18px] font-bold text-white">No Payment Methods Added</h3>
            <p className="mt-2 text-[14px] text-[#848e9c] max-w-[250px]">
              Add a payment method to start P2P trading.
            </p>
          </div>
        ) : (
          // Payment Methods List
          <div className="space-y-4">
            {methods.map(method => (
              <PaymentMethodCard 
                key={method.id} 
                method={method} 
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}

        <button 
          onClick={handleOpenAdd}
          className="mt-6 w-full flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary/10 text-[15px] font-bold text-primary hover:bg-primary/20 transition active:scale-[0.98]"
        >
          <FiPlus size={18} /> Add Payment Method
        </button>
      </div>

      <AddEditPaymentMethodModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMethod}
        initialData={editingMethod}
      />
    </div>
  );
}
