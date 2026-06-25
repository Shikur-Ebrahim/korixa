"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiUpload, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";
import { LivenessWebcam } from "@/components/kyc/LivenessWebcam";
import { compareFaces } from "@/lib/kyc/face-match";
import { extractIdDataFromImage } from "@/lib/kyc/ocr";
import { fileToDataUrl, uploadImageWithAuth } from "@/lib/kyc/upload";
import type { ExtractedIdData, UserKycRecord } from "@/lib/kyc/types";

type WizardStep = "upload-id" | "selfie" | "review" | "processing" | "result";

type IdDocumentType = "national_id" | "passport" | "driver_license";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload-id", label: "Upload ID" },
  { id: "selfie", label: "Selfie" },
  { id: "review", label: "Submit" },
  { id: "processing", label: "Processing" },
  { id: "result", label: "Result" },
];

const DOCUMENT_OPTIONS: { value: IdDocumentType; label: string }[] = [
  { value: "national_id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "driver_license", label: "Driver License" },
];

function KycWizardContent() {
  const searchParams = useSearchParams();
  const started = searchParams.get("start") === "1";

  const { user, getIdToken, refreshKyc, kyc, kycStatus } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("upload-id");
  const [documentType, setDocumentType] = useState<IdDocumentType>("national_id");
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [faceMatch, setFaceMatch] = useState<{ distance: number; score: number } | null>(null);
  const [result, setResult] = useState<UserKycRecord | null>(null);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const showWizard = started || kycStatus === "verified" || step === "result";

  useEffect(() => {
    if (kyc?.kycStatus === "verified" && !result) {
      setResult(kyc);
      setStep("result");
    }
  }, [kyc, result]);

  const statusBadge = useMemo(() => {
    const status = result?.kycStatus ?? kyc?.kycStatus ?? "pending";

    if (status === "verified") {
      return { label: "Verified", className: "text-secondary border-secondary/30 bg-secondary/10" };
    }

    if (status === "rejected") {
      return { label: "Rejected", className: "text-red-400 border-red-400/30 bg-red-400/10" };
    }

    return { label: "Pending", className: "text-primary border-primary/30 bg-primary/10" };
  }, [kyc?.kycStatus, result?.kycStatus]);

  const handleIdFile = async (side: "front" | "back", file: File) => {
    setError(null);
    setBusy(true);

    try {
      const dataUrl = await fileToDataUrl(file);

      if (side === "front") {
        setIdFrontPreview(dataUrl);
      } else {
        setIdBackPreview(dataUrl);
      }
    } catch {
      setError(`Failed to read ${side} ID image.`);
    } finally {
      setBusy(false);
    }
  };

  const canContinueFromId = Boolean(fullName.trim().length >= 2 && idFrontPreview && idBackPreview);

  const runVerification = async () => {
    if (!idFrontPreview || !idBackPreview || !selfiePreview || !user || !fullName) return;

    setStep("processing");
    setError(null);
    setBusy(true);

    try {
      const token = await getIdToken();

      if (!token) {
        throw new Error("Session expired. Please sign in again.");
      }

      const [ocr, match] = await Promise.all([
        extractIdDataFromImage(idFrontPreview),
        compareFaces(idFrontPreview, selfiePreview),
      ]);

      const [idImageUrl, idBackImageUrl, selfieImageUrl] = await Promise.all([
        uploadImageWithAuth(idFrontPreview, `korixa/kyc/${user.uid}/id-front`, token),
        uploadImageWithAuth(idBackPreview, `korixa/kyc/${user.uid}/id-back`, token),
        uploadImageWithAuth(selfiePreview, `korixa/kyc/${user.uid}/selfie`, token),
      ]);

      const enrichedOcr: ExtractedIdData = {
        ...ocr,
        rawText: `[${documentType}] back_url:${idBackImageUrl} ${ocr.rawText}`,
      };

      setExtractedData(enrichedOcr);
      setFaceMatch({ distance: match.distance, score: match.score });

      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          idImageUrl,
          selfieImageUrl,
          extractedIdData: enrichedOcr,
          faceMatchDistance: match.distance,
          faceMatchScore: match.score,
          livenessPassed: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Verification submission failed.");
      }

      setResult(data.kyc as UserKycRecord);
      await refreshKyc();
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setStep("review");
    } finally {
      setBusy(false);
    }
  };

  if (!showWizard) {
    return (
      <div className="mx-auto max-w-lg">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] via-[#0f1923] to-[#0b0e11] p-6 mb-5 text-center">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/25">
              <FiCheck className="text-primary" size={28} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Identity Verification</h1>
            <p className="text-[10px] md:text-xs text-[#848e9c] max-w-xs mx-auto leading-relaxed">
              Verify your identity once to unlock the full power of Korixa — secure P2P trading, crypto deposits, and withdrawals.
            </p>
          </div>
        </div>

        {/* What you unlock */}
        <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 mb-5">
          <h2 className="text-xs md:text-sm font-bold text-white mb-4">What you unlock after verification</h2>
          <div className="space-y-3">
            {[
              { icon: "💸", title: "P2P Trading", desc: "Buy and sell USDT directly with verified merchants." },
              { icon: "🏦", title: "Crypto Deposits", desc: "Receive USDT to your personal wallet address." },
              { icon: "🔒", title: "Secure Account", desc: "Your account is protected under KYC compliance." },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0b0e11] text-base">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs md:text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-[10px] md:text-xs text-[#848e9c]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What you need */}
        <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 mb-6">
          <h2 className="text-xs md:text-sm font-bold text-white mb-4">What you will need</h2>
          <div className="space-y-2">
            {[
              "A valid national ID, passport, or driver's license",
              "A clear photo of both front and back of your document",
              "A quick selfie photo for face matching",
              "Good lighting and a steady hand — takes under 3 minutes",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="text-[10px] md:text-xs text-[#848e9c] leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/kyc?start=1"
          className="flex w-full items-center justify-center rounded-xl bg-primary py-4 text-xs md:text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90 active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          Start Verification
        </Link>
        <p className="mt-3 text-center text-[9px] md:text-[10px] text-[#848e9c]">
          Your data is encrypted and handled securely. We do not share your information with third parties.
        </p>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <div>
            <h1 className={appTheme.title}>Identity verification</h1>
            <p className={appTheme.subtitle}>
              Complete KYC to unlock trading, wallet, and advanced features.
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      {step !== "result" && (
        <div className="mb-6 grid grid-cols-5 gap-2">
          {STEPS.slice(0, 4).map((item, index) => {
            const done = index < stepIndex;
            const active = item.id === step;

            return (
              <div key={item.id} className="text-center">
                <div
                  className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-secondary text-white"
                      : active
                        ? "bg-primary text-white"
                        : "border border-white/[0.08] bg-[#0b0e11] text-[#848e9c]"
                  }`}
                >
                  {done ? <FiCheck /> : index + 1}
                </div>
                <p className={`text-[10px] sm:text-xs ${active ? "text-white" : "text-[#848e9c]"}`}>
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className={appTheme.card}>
        {error && (
          <p className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {step === "upload-id" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white sm:text-lg">Step 1 — Upload ID document</h2>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#848e9c]">Document type</span>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as IdDocumentType)}
                className={appTheme.input}
              >
                {DOCUMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#848e9c]">Full Legal Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="As it appears on your ID"
                className={appTheme.input}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#848e9c]">Location</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0b0e11] px-3 py-2.5 text-sm text-white">
                <span className="text-lg leading-none" aria-hidden>
                  🇪🇹
                </span>
                <span>Ethiopian</span>
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#848e9c]">Front side</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0b0e11] px-4 py-8 transition hover:border-primary/40 hover:bg-primary/5">
                  <FiUpload className="mb-2 text-xl text-primary" />
                  <span className="text-sm font-medium text-white">Upload front</span>
                  <span className="mt-1 text-xs text-[#848e9c]">JPG or PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleIdFile("front", file);
                    }}
                  />
                </label>
                {idFrontPreview && (
                  <img
                    src={idFrontPreview}
                    alt="ID front preview"
                    className="max-h-48 w-full rounded-xl border border-white/[0.06] object-contain"
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[#848e9c]">Back side</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0b0e11] px-4 py-8 transition hover:border-primary/40 hover:bg-primary/5">
                  <FiUpload className="mb-2 text-xl text-primary" />
                  <span className="text-sm font-medium text-white">Upload back</span>
                  <span className="mt-1 text-xs text-[#848e9c]">JPG or PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleIdFile("back", file);
                    }}
                  />
                </label>
                {idBackPreview && (
                  <img
                    src={idBackPreview}
                    alt="ID back preview"
                    className="max-h-48 w-full rounded-xl border border-white/[0.06] object-contain"
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!canContinueFromId || busy}
              onClick={() => setStep("selfie")}
              className={`${appTheme.btnPrimary} w-full py-3 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Continue to selfie
            </button>
          </div>
        )}

        {step === "selfie" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white sm:text-lg">Step 2 — Selfie verification</h2>
            <p className="text-xs text-[#848e9c] sm:text-sm">
              Follow the AI voice assistant — blink, turn your head, and smile. Your selfie is captured
              automatically when all checks pass.
            </p>

            {!selfiePreview ? (
              <LivenessWebcam
                disabled={busy}
                onCapture={(dataUrl) => {
                  setSelfiePreview(dataUrl);
                  setStep("review");
                }}
              />
            ) : (
              <img
                src={selfiePreview}
                alt="Selfie preview"
                className="max-h-72 w-full rounded-xl border border-white/[0.06] object-cover"
              />
            )}
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-white sm:text-lg">Step 3 — Review & submit</h2>
            <div className="rounded-lg bg-[#0b0e11] px-3 py-2 text-xs text-[#848e9c]">
              <p>Document: {DOCUMENT_OPTIONS.find((d) => d.value === documentType)?.label}</p>
              <p>Location: 🇪🇹 Ethiopian</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {idFrontPreview && (
                <div>
                  <p className="mb-1 text-[11px] font-medium text-[#848e9c]">ID front</p>
                  <img
                    src={idFrontPreview}
                    alt="ID front"
                    className="h-40 w-full rounded-xl border border-white/[0.06] object-cover"
                  />
                </div>
              )}
              {idBackPreview && (
                <div>
                  <p className="mb-1 text-[11px] font-medium text-[#848e9c]">ID back</p>
                  <img
                    src={idBackPreview}
                    alt="ID back"
                    className="h-40 w-full rounded-xl border border-white/[0.06] object-cover"
                  />
                </div>
              )}
              {selfiePreview && (
                <div>
                  <p className="mb-1 text-[11px] font-medium text-[#848e9c]">Selfie</p>
                  <img
                    src={selfiePreview}
                    alt="Selfie"
                    className="h-40 w-full rounded-xl border border-white/[0.06] object-cover"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runVerification()}
              className={`${appTheme.btnPrimary} w-full py-3 disabled:opacity-50`}
            >
              Submit verification
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <h2 className="text-base font-semibold text-white sm:text-lg">Step 4 — Processing</h2>
            <p className="mt-2 text-xs text-[#848e9c] sm:text-sm">
              Running OCR, face match, uploading images, and saving your verification...
            </p>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4 text-center">
            <h2 className="text-base font-semibold text-white sm:text-lg">Verification result</h2>
            <div
              className={`mx-auto max-w-md rounded-xl border px-4 py-5 ${
                result.kycStatus === "verified"
                  ? "border-secondary/30 bg-secondary/10"
                  : "border-red-400/30 bg-red-400/10"
              }`}
            >
              <p className="text-sm font-semibold capitalize text-white sm:text-base">{result.kycStatus}</p>
              {result.rejectionReason && (
                <p className="mt-2 text-xs text-[#848e9c] sm:text-sm">{result.rejectionReason}</p>
              )}
            </div>

            {result.kycStatus === "verified" ? (
              <Link href="/dashboard" className={`${appTheme.btnPrimary} inline-flex px-5 py-2.5`}>
                Go to dashboard
              </Link>
            ) : (
              <Link
                href="/kyc?start=1"
                className={`${appTheme.btnPrimary} inline-flex px-5 py-2.5`}
                onClick={() => {
                  setStep("upload-id");
                  setIdFrontPreview(null);
                  setIdBackPreview(null);
                  setSelfiePreview(null);
                  setResult(null);
                }}
              >
                Try again
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function KycWizard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <KycWizardContent />
    </Suspense>
  );
}
