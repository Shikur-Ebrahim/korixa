import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminProtectedRoute } from "@/components/admin/AdminProtectedRoute";

export const metadata = { title: "Admin — Korixa" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminProtectedRoute>
      <AdminShell>{children}</AdminShell>
    </AdminProtectedRoute>
  );
}
