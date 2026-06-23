"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getClientAuth } from "@/lib/firebase";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [allowRedirect, setAllowRedirect] = useState(false);

  useEffect(() => {
    if (!initialized || loading) {
      setAllowRedirect(false);
      return;
    }

    if (user || getClientAuth().currentUser) {
      setAllowRedirect(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!getClientAuth().currentUser) {
        setAllowRedirect(true);
        router.replace("/");
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [initialized, loading, user, router]);

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e11]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeUser = user ?? getClientAuth().currentUser;

  if (!activeUser) {
    if (allowRedirect) {
      return null;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e11]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return children;
}
