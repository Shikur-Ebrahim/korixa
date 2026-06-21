"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCheck, FiClipboard, FiCopy } from "react-icons/fi";

type OtpVerificationProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
};

export function OtpVerification({
  value,
  onChange,
  onComplete,
  disabled = false,
}: OtpVerificationProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [copied, setCopied] = useState(false);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const updateCode = useCallback(
    (next: string) => {
      const cleaned = next.replace(/\D/g, "").slice(0, 6);
      onChange(cleaned);
      if (cleaned.length === 6) {
        onComplete?.(cleaned);
      }
    },
    [onChange, onComplete]
  );

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const next = digits.map((d, i) => (i === index ? digit : d.trim())).join("").replace(/\s/g, "");
    updateCode(next);

    if (index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === "Backspace") {
      if (digits[index]?.trim()) {
        const next = digits
          .map((d, i) => (i === index ? "" : d.trim()))
          .join("")
          .replace(/\s/g, "");
        updateCode(next);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = digits
          .map((d, i) => (i === index - 1 ? "" : d.trim()))
          .join("")
          .replace(/\s/g, "");
        updateCode(next);
      }
    }
  };

  const handlePaste = (text: string) => {
    updateCode(text);
    const len = Math.min(text.replace(/\D/g, "").length, 6);
    inputsRef.current[Math.min(len, 5)]?.focus();
  };

  const copyCode = async () => {
    if (value.length !== 6) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const pasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handlePaste(text);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="relative space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">6-digit code</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={pasteCode}
            disabled={disabled}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
          >
            <FiClipboard className="h-3 w-3" />
            Paste
          </button>
          <button
            type="button"
            onClick={copyCode}
            disabled={disabled || value.length !== 6}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:bg-white/5 hover:text-foreground disabled:opacity-50"
          >
            {copied ? <FiCheck className="h-3 w-3 text-secondary" /> : <FiCopy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Hidden input for iOS/Android one-time-code autofill from email/SMS */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => updateCode(e.target.value)}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />

      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit.trim()}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e.key)}
            onPaste={(e) => {
              e.preventDefault();
              handlePaste(e.clipboardData.getData("text"));
            }}
            className="h-11 w-full max-w-[44px] rounded-xl border border-blue-400/30 bg-[#0F2A52] text-center font-mono text-lg text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-60 sm:h-12 sm:max-w-[48px]"
          />
        ))}
      </div>

      <p className="text-center text-[11px] text-muted">
        Code auto-fills from email link or keyboard suggestion
      </p>
    </div>
  );
}

/** Read email + code from URL for deep-link verification */
export function useOtpFromUrl(): { email: string | null; code: string | null } {
  const [params, setParams] = useState({ email: null as string | null, code: null as string | null });

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setParams({
      email: search.get("email"),
      code: search.get("code")?.replace(/\D/g, "").slice(0, 6) ?? null,
    });
  }, []);

  return params;
}
