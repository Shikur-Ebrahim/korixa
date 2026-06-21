"use client";

import { FiAlertCircle, FiX } from "react-icons/fi";

type VerificationNoticeProps = {
  message: string | null;
  onDismiss?: () => void;
};

export function VerificationNotice({ message, onDismiss }: VerificationNoticeProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-[4.5rem] z-[70] rounded-2xl border border-primary/30 bg-[#161a1e] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-opacity"
    >
      <div className="flex items-start gap-3">
        <FiAlertCircle className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Verification required</p>
          <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">{message}</p>
          <p className="mt-2 text-[11px] text-primary">Redirecting to verification...</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 text-[#848e9c] transition hover:text-white"
            aria-label="Dismiss"
          >
            <FiX />
          </button>
        )}
      </div>
    </div>
  );
}
