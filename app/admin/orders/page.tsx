"use client";

import { AdminOrderManagement } from "@/components/admin/p2p/AdminOrderManagement";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Orders</h1>
        <p className="text-sm text-[#848e9c]">Manage all P2P orders.</p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-[#1e2329] p-4">
        <AdminOrderManagement />
      </div>
    </div>
  );
}
