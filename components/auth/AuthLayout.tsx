"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0A1628] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Image
            src="/app logo.jpg"
            alt="Korixa"
            width={112}
            height={112}
            className="h-auto w-[112px] rounded-2xl object-contain"
          />
        </Link>

        <div className="mb-6">
          <h1 className="mb-1.5 text-xl font-bold sm:text-2xl">{title}</h1>
          <p className="text-sm text-blue-200/70">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-blue-400/20 bg-[#1A3A6B] p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-blue-400/30 bg-[#0F2A52] px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
      />
    </label>
  );
}

export function AuthSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <select
        {...props}
        className="w-full rounded-xl border border-blue-400/30 bg-[#0F2A52] px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
      >
        {children}
      </select>
    </label>
  );
}

export function AuthButton({
  children,
  loading,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "outline";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-background hover:bg-primary/90 shadow-[0_4px_14px_rgba(247,147,26,0.25)]"
      : "border border-border bg-transparent text-foreground hover:bg-white/5";

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${props.className ?? ""}`}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
      {message}
    </p>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#1A3A6B] px-3 text-xs text-blue-200/70">or continue with</span>
      </div>
    </div>
  );
}
