"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { FiShield, FiTerminal, FiInfo, FiLock, FiDollarSign, FiArrowRight } from "react-icons/fi";

export default function AdminSettingsPage() {
  const { user, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  
  const [isVerifying, setIsVerifying] = useState(false);

  const cliCommand = `node set-admin.js ${user?.email ?? "user@email.com"}`;

  const copyCommand = () => {
    void navigator.clipboard.writeText("node set-admin.js user@email.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setPasswordMsg("Password must be at least 6 characters.");
      return;
    }
    setIsChangingPassword(true);
    setPasswordMsg("");
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg("Password successfully changed!");
        setNewPassword("");
      } else {
        setPasswordMsg(data.error || "Failed to change password.");
      }
    } catch (e) {
      setPasswordMsg("An error occurred.");
    } finally {
      setIsChangingPassword(false);
    }
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

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0b0e11] p-6 shadow-2xl">
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiLock size={28} />
              </div>
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-white">Enter Admin PIN</h3>
            <p className="mb-6 text-center text-xs text-[#848e9c]">
              Please enter the master admin PIN to access the Platform Wallet.
            </p>
            
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinError("");
              }}
              placeholder="••••••"
              className="mb-4 w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-4 text-center text-xl tracking-widest text-white outline-none focus:border-primary/50"
              autoFocus
            />
            
            {pinError && <p className="mb-4 text-center text-xs text-red-400">{pinError}</p>}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPin("");
                  setPinError("");
                }}
                className="flex-1 rounded-xl bg-white/[0.04] py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                disabled={isVerifying || !pin}
                onClick={async () => {
                  setIsVerifying(true);
                  setPinError("");
                  try {
                    const token = await getIdToken();
                    const res = await fetch("/api/admin/wallet/pin", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({ action: "verify", pin })
                    });
                    if (res.ok) {
                      setShowPinModal(false);
                      router.push("/admin/wallet");
                    } else {
                      const d = await res.json();
                      setPinError(d.error || "Invalid PIN. Please try again.");
                    }
                  } catch (e) {
                    setPinError("Connection error.");
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                className="flex-1 rounded-xl bg-primary py-3.5 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isVerifying ? "Verifying..." : "Verify & Open"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Wallet - Protected */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <FiDollarSign size={80} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <FiLock size={16} />
          </div>
          <p className="text-sm font-semibold text-white">Platform Wallet</p>
        </div>
        <p className="text-xs text-[#848e9c] relative z-10 leading-relaxed pr-8">
          Access the master wallet, manage user deposits, and sweep real TRC20 USDT funds. This area is highly restricted.
        </p>
        <button
          onClick={() => setShowPinModal(true)}
          className="relative z-10 mt-2 flex w-full items-center justify-between rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/20"
        >
          <span>Open Secure Wallet</span>
          <FiArrowRight />
        </button>
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
      </div>

      {/* Change Admin Password */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FiLock className="text-primary" />
          <p className="text-sm font-semibold text-white">Change Admin Password</p>
        </div>
        <p className="text-xs text-[#848e9c]">
          Update your admin account login password. You will use this new password the next time you sign in.
        </p>
        <div className="space-y-2 pt-1">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min 6 chars)"
            className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] px-4 py-3 text-sm text-white outline-none focus:border-primary/50"
          />
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>
              {passwordMsg}
            </p>
          )}
          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword || !newPassword}
            className="w-full rounded-xl bg-white/[0.04] py-3 text-sm font-bold text-white transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </button>
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
