"use client";

import { useState } from "react";
import { AuthButton, AuthError, AuthInput, AuthLayout } from "./AuthLayout";
import { verifyLoginMfa, verifyLoginRecoveryCode } from "@/lib/profile/security-actions";
import { useAuth } from "./AuthProvider";
import { FiShield, FiKey } from "react-icons/fi";

export function MfaVerificationScreen({ onVerified, onCancel }: { onVerified: () => void, onCancel: () => void }) {
  const { getIdToken } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated");

      if (useRecovery) {
        await verifyLoginRecoveryCode(token, code.trim());
      } else {
        await verifyLoginMfa(token, code.replace(/\s+/g, ""));
      }
      
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e11] flex flex-col">
      <AuthLayout
        title={useRecovery ? "Recovery Code" : "2-Step Verification"}
        subtitle={useRecovery ? "Enter one of your 8-character recovery codes." : "Enter the 6-digit code from your Authenticator App."}
      >
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {useRecovery ? <FiKey size={28} /> : <FiShield size={28} />}
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <AuthError message={error} />

          <AuthInput
            label={useRecovery ? "Recovery Code" : "Authenticator Code"}
            type="text"
            placeholder={useRecovery ? "e.g. a1b2c3d4" : "000000"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="off"
            maxLength={useRecovery ? 8 : 6}
            className="text-center text-2xl tracking-widest"
          />

          <AuthButton type="submit" loading={loading} disabled={code.length < 6}>
            Verify
          </AuthButton>

          <div className="pt-4 flex flex-col gap-3 text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setUseRecovery(!useRecovery);
                setCode("");
                setError(null);
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              {useRecovery ? "Use Authenticator App instead" : "Lost access? Use a Recovery Code"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#848e9c] hover:text-white mt-4"
            >
              Cancel and sign out
            </button>
          </div>
        </form>
      </AuthLayout>
    </div>
  );
}
