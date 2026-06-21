import type { ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShellLayout } from "@/components/layout/AppShellLayout";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShellLayout>{children}</AppShellLayout>
    </ProtectedRoute>
  );
}
