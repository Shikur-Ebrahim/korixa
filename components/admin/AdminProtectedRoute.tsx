"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, role, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized || loading) return;
    if (!user) { router.replace("/sign-up"); return; }
    if (role === "user") { router.replace("/dashboard"); return; }
  }, [initialized, loading, user, role, router]);

  if (!initialized || loading || role === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e11]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-[#848e9c]">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  return <>{children}</>;
}
