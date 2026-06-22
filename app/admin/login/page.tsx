"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase";
import { AuthButton, AuthError, AuthInput, AuthLayout } from "@/components/auth/AuthLayout";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCred = await signInWithEmailAndPassword(getClientAuth(), email, password);
      const tokenResult = await userCred.user.getIdTokenResult(true);
      
      if (tokenResult.claims.role === "admin") {
        router.replace("/admin");
      } else {
        await getClientAuth().signOut();
        throw new Error("Unauthorized. Admin access only.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628]">
      <AuthLayout
        title="Admin Portal"
        subtitle="Restricted access. Sign in to continue."
      >
        <form className="space-y-4" onSubmit={handleLogin}>
          <AuthError message={error} />
          
          <AuthInput
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@korixapay.com"
            required
            autoComplete="email"
          />
          
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <AuthButton type="submit" loading={loading}>
            Sign In
          </AuthButton>
        </form>
      </AuthLayout>
    </div>
  );
}
