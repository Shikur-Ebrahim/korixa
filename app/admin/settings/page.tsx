"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiShield, FiTerminal, FiInfo } from "react-icons/fi";

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const cliCommand = `node set-admin.js ${user?.email ?? "user@email.com"}`;

  const copyCommand = () => {
    void navigator.clipboard.writeText("node set-admin.js user@email.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">Admin configuration &amp; developer tools</p>
      </div>

      {/* Current admin info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FiShield className="text-primary" />
          <p className="text-sm font-semibold text-white">Admin Account</p>
        </div>
        <div className="space-y-1.5 text-xs text-[#848e9c]">
          <div className="flex justify-between">
            <span>Email</span>
            <span className="text-white">{user?.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>UID</span>
            <span className="font-mono text-[10px] text-white">{user?.uid?.slice(0, 16) ?? "—"}…</span>
          </div>
          <div className="flex justify-between">
            <span>Role</span>
            <span className="font-semibold text-primary">admin</span>
          </div>
        </div>
      </div>

      {/* CLI tool */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FiTerminal className="text-primary" />
          <p className="text-sm font-semibold text-white">Assign Admin Role</p>
        </div>
        <p className="text-xs text-[#848e9c]">
          Run this command in your terminal from the project root to promote any user to admin:
        </p>
        <div className="relative rounded-xl bg-[#0b0e11] border border-white/[0.06] px-3 py-3">
          <code className="block font-mono text-[11px] text-emerald-400 pr-14 break-all">
            node set-admin.js user@email.com
          </code>
          <button
            onClick={copyCommand}
            className="absolute right-2 top-2 rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] font-medium text-[#848e9c] transition hover:text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 space-y-1">
          <p className="text-[10px] font-semibold text-primary flex items-center gap-1">
            <FiInfo className="text-xs" /> After running
          </p>
          <ul className="text-[10px] text-[#848e9c] space-y-0.5 list-disc list-inside">
            <li>Firebase custom claim <code className="text-white">role: "admin"</code> is set</li>
            <li>Firestore <code className="text-white">users/{"{uid}"}</code> is updated</li>
            <li>User must sign out and sign back in for the change to take effect</li>
          </ul>
        </div>
      </div>

      {/* Platform info */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-2">
        <p className="text-sm font-semibold text-white">Platform</p>
        <div className="space-y-1.5 text-xs text-[#848e9c]">
          <div className="flex justify-between">
            <span>Version</span><span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Environment</span>
            <span className="text-white">{process.env.NODE_ENV ?? "production"}</span>
          </div>
          <div className="flex justify-between">
            <span>App URL</span>
            <span className="text-white">korixapay.com</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => void logout()}
        className="w-full rounded-xl border border-red-400/20 bg-red-400/10 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-400/15"
      >
        Sign Out
      </button>
    </div>
  );
}
