"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import { getClientAuth } from "@/lib/firebase";
import { getSocialAuthProvider } from "@/lib/social-auth";

function getSocialAuthErrorMessage(error: unknown, provider: "google" | "facebook"): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);

    if (code === "auth/popup-closed-by-user") {
      return "Sign-up was cancelled.";
    }

    if (code === "auth/account-exists-with-different-credential") {
      return "An account already exists with this email. Try email verification instead.";
    }

    if (provider === "facebook" && code === "auth/invalid-credential") {
      return "Facebook login failed. Check that Facebook Login is enabled in Firebase and Meta Developer Console.";
    }
  }

  return error instanceof Error ? error.message : "Social sign-up failed.";
}

/**
 * Calls the server-side init-wallets endpoint after social sign-in.
 * This uses Firebase Admin SDK on the server to bypass Firestore security rules,
 * ensuring wallets are always created regardless of client-side rule restrictions.
 */
async function initWalletsForUser(): Promise<void> {
  try {
    const auth = getClientAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const token = await currentUser.getIdToken();
    await fetch("/api/auth/init-wallets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // Non-fatal — wallets can be created on next login attempt too
    console.warn("Could not initialize wallets after social sign-in:", err);
  }
}

export function SocialAuthButtons() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSocialAuth = async (provider: "google" | "facebook") => {
    setLoading(provider);
    setError(null);

    try {
      await signInWithPopup(getClientAuth(), getSocialAuthProvider(provider));

      // Initialize Firestore wallets via server (uses Admin SDK — bypasses security rules)
      await initWalletsForUser();

      router.push("/dashboard");
    } catch (err) {
      setError(getSocialAuthErrorMessage(err, provider));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => handleSocialAuth("google")}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-[#0F2A52] px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-[#0F2A52]/80 disabled:opacity-60"
      >
        <FaGoogle className="text-base" />
        {loading === "google" ? "Connecting..." : "Google"}
      </button>

      <button
        type="button"
        onClick={() => handleSocialAuth("facebook")}
        disabled={!!loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400/30 bg-[#0F2A52] px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-[#0F2A52]/80 disabled:opacity-60"
      >
        <FaFacebook className="text-base text-blue-400" />
        {loading === "facebook" ? "Connecting..." : "Facebook"}
      </button>
    </div>
  );
}
