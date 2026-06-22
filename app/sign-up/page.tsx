"use client";

import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import {
  AuthButton,
  AuthDivider,
  AuthError,
  AuthInput,
  AuthLayout,
} from "@/components/auth/AuthLayout";
import { useAuth } from "@/components/auth/AuthProvider";
import { OtpVerification, useOtpFromUrl } from "@/components/auth/OtpVerification";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { getClientAuth } from "@/lib/firebase";

type Step = "email" | "otp";

async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      res.status === 404
        ? "Sign-up service unavailable. Redeploy the app and try again."
        : `Server error (${res.status}). Open /api/auth/health on your site to check env vars. ${preview ? `(${preview})` : ""}`
    );
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid server response. Please try again.");
  }
}

function SignUpForm() {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuth();
  const urlParams = useOtpFromUrl();
  const autoVerified = useRef(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const verifyOtp = useCallback(
    async (code: string, emailAddress: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailAddress,
            code,
          }),
        });

        const data = await parseApiJson(res);
        if (!res.ok) throw new Error(String(data.error ?? "Verification failed"));

        const customToken = data.customToken;
        if (typeof customToken !== "string") {
          throw new Error("Invalid verification response.");
        }

        const userCred = await signInWithCustomToken(getClientAuth(), customToken);
        
        // Fast redirect by checking the role immediately
        const tokenResult = await userCred.user.getIdTokenResult();
        if (tokenResult.claims.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
        setLoading(false); // Only stop loading on error, let the redirect happen otherwise
      }
    },
    [router]
  );

  useEffect(() => {
    // If user is already logged in, AuthProvider handles the redirect.
    // We just wait here.
  }, [initialized, authLoading, user]);

  useEffect(() => {
    if (!urlParams.email || !urlParams.code || autoVerified.current) return;

    setEmail(urlParams.email);
    setOtp(urlParams.code);
    setStep("otp");
    autoVerified.current = true;
    verifyOtp(urlParams.code, urlParams.email);
  }, [urlParams, verifyOtp]);

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await parseApiJson(res);
      if (!res.ok) throw new Error(String(data.error ?? "Failed to send code"));

      setMessage(String(data.message ?? "Verification code sent."));
      setOtp(""); // Clear the old code so user can type the new one
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Get started"
      subtitle="Enter your email — no password needed. We'll send a 6-digit code."
    >
      {step === "email" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendOtp();
          }}
        >
          <AuthError message={error} />
          {message && (
            <p className="rounded-xl border border-secondary/20 bg-secondary/10 px-3 py-2 text-xs text-secondary">
              {message}
            </p>
          )}

          <AuthInput
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <AuthButton type="submit" loading={loading}>
            Continue with email
          </AuthButton>

          <AuthDivider />
          <SocialAuthButtons />
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            verifyOtp(otp, email);
          }}
        >
          <AuthError message={error} />
          <p className="text-xs text-muted">
            We sent a 6-digit code to <span className="text-foreground">{email}</span>
          </p>

          <OtpVerification
            value={otp}
            onChange={setOtp}
            onComplete={(code) => verifyOtp(code, email)}
            disabled={loading}
          />

          <AuthButton type="submit" loading={loading} disabled={otp.length !== 6}>
            Verify and continue
          </AuthButton>

          <AuthButton type="button" variant="outline" loading={loading} onClick={sendOtp}>
            Resend code
          </AuthButton>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError(null);
            }}
            className="w-full text-center text-xs text-muted hover:text-foreground"
          >
            Change email
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A1628]" />}>
      <SignUpForm />
    </Suspense>
  );
}
