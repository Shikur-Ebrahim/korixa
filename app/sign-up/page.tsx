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

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Verification failed");

        await signInWithCustomToken(getClientAuth(), data.customToken);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed.");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!initialized || authLoading || !user) return;
    router.replace("/dashboard");
  }, [initialized, authLoading, user, router]);

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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send code");

      setMessage(data.message);
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
