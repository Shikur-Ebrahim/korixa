"use client";

import { useState } from "react";
import { FiUsers, FiShoppingBag, FiList, FiAlertTriangle } from "react-icons/fi";
import { MerchantManagement } from "@/components/admin/p2p/MerchantManagement";
import { AdvertisementManagement } from "@/components/admin/p2p/AdvertisementManagement";
import { AdminOrderManagement } from "@/components/admin/p2p/AdminOrderManagement";

type Tab = "merchants" | "ads" | "orders" | "appeals";

export default function AdminP2PPage() {
  const [activeTab, setActiveTab] = useState<Tab>("merchants");

  const tabs = [
    { id: "merchants", label: "Merchants", icon: FiUsers },
    { id: "ads", label: "Advertisements", icon: FiShoppingBag },
    { id: "orders", label: "Orders", icon: FiList },
    { id: "appeals", label: "Appeals", icon: FiAlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">P2P Management</h1>
        <p className="text-sm text-[#848e9c]">Manage merchants, ads, and orders.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-[#0b0e11]"
                  : "bg-[#1e2329] text-[#848e9c] hover:bg-[#2b3139] hover:text-white"
              }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
        {activeTab === "merchants" && <MerchantManagement />}
        {activeTab === "ads" && <AdvertisementManagement />}
        {activeTab === "orders" && <AdminOrderManagement />}
        {activeTab === "appeals" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiAlertTriangle className="mb-3 text-4xl text-[#848e9c]" />
            <h3 className="text-lg font-medium text-white">Appeal Management</h3>
            <p className="mt-1 text-sm text-[#848e9c]">Coming soon in Phase 2.</p>
          </div>
        )}
      </div>
    </div>
  );
}
