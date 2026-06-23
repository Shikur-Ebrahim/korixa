"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserSecurity, getUserProfile } from "@/lib/profile/service";
import type { UserSecurity, UserProfile } from "@/lib/profile/types";
import { FiCheck, FiMail, FiSmartphone, FiShield, FiAlertTriangle, FiKey, FiLock, FiLogOut } from "react-icons/fi";

function calculateSecurityScore(profile: UserProfile | null, security: UserSecurity | null) {
  let score = 0;
  if (!security) return score;

  if (security.emailVerified) score += 10;
  if (security.phoneVerified) score += 15;
  if (security.mfaEnabled) score += 30;
  // Let's assume trusted device and recovery codes for now
  score += 10; // trusted device (base)
  if (security.antiPhishingCode) score += 10;
  if (security.withdrawalWhitelistEnabled) score += 15;
  
  return Math.min(score, 100);
}

export default function SecurityCenter() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [security, setSecurity] = useState<UserSecurity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const p = await getUserProfile(user.uid);
        const s = await getUserSecurity(user.uid);
        setProfile(p);
        setSecurity(s);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [user]);

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/[0.02] rounded-2xl"></div>;
  }

  const score = calculateSecurityScore(profile, security);
  const scoreColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const textColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl md:text-2xl font-bold">Security Center</h1>

      {/* Security Dashboard Header */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex-1 w-full">
            <h2 className="text-lg font-bold mb-2">Security Score</h2>
            <div className="flex items-center gap-4 mb-2">
              <span className={`text-3xl font-bold ${textColor}`}>{score}</span>
              <span className="text-sm text-[#848e9c]">/ 100</span>
            </div>
            
            <div className="h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div className={`h-full ${scoreColor} transition-all duration-1000`} style={{ width: `${score}%` }} />
            </div>
            
            <p className="text-xs text-[#848e9c] mt-3">
              Last security check: {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex-1 w-full md:pl-6 md:border-l border-white/[0.06]">
            <h3 className="text-sm font-bold text-white mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {!security?.mfaEnabled && (
                <li className="flex items-center gap-2 text-xs text-[#848e9c]">
                  <FiAlertTriangle className="text-yellow-500" /> Enable Google Authenticator (+30)
                </li>
              )}
              {!security?.phoneVerified && (
                <li className="flex items-center gap-2 text-xs text-[#848e9c]">
                  <FiAlertTriangle className="text-yellow-500" /> Verify Phone Number (+15)
                </li>
              )}
              {!security?.antiPhishingCode && (
                <li className="flex items-center gap-2 text-xs text-[#848e9c]">
                  <FiAlertTriangle className="text-yellow-500" /> Add Anti-Phishing Code (+10)
                </li>
              )}
              {score >= 100 && (
                <li className="flex items-center gap-2 text-xs text-green-500">
                  <FiCheck /> Your account is fully secured.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Email Verification */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiMail size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Email Verification</h3>
                {security?.emailVerified ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500"><FiCheck /> Verified</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-red-500">Unverified</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#848e9c] line-clamp-1">{profile?.email}</p>
              <div className="mt-4 flex gap-3">
                <button className="text-xs font-semibold text-primary hover:text-white transition">Change Email</button>
              </div>
            </div>
          </div>
        </div>

        {/* Phone Verification */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiSmartphone size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Phone Verification</h3>
                {security?.phoneVerified ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500"><FiCheck /> Verified</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-yellow-500">Unverified</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#848e9c] line-clamp-1">
                {security?.phoneVerified ? profile?.phoneNumber : "Used for withdrawals and security modifications"}
              </p>
              <div className="mt-4 flex gap-3">
                {security?.phoneVerified ? (
                  <button className="text-xs font-semibold text-primary hover:text-white transition">Change Phone</button>
                ) : (
                  <button className="rounded bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition">Add Phone Number</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication (MFA) */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiShield size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Authenticator App (MFA)</h3>
                {security?.mfaEnabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500"><FiCheck /> Enabled</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-yellow-500">Recommended</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#848e9c]">
                Protect your account with Google Authenticator, Authy, or Microsoft Authenticator.
              </p>
              <div className="mt-4 flex gap-3">
                {security?.mfaEnabled ? (
                  <button className="rounded bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-xs font-bold text-white hover:bg-white/[0.08] transition">Manage</button>
                ) : (
                  <button className="rounded bg-primary px-4 py-1.5 text-xs font-bold text-[#0b0e11] hover:bg-primary/90 transition">Enable MFA</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Anti-Phishing Code */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiKey size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Anti-Phishing Code</h3>
                {security?.antiPhishingCode ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500"><FiCheck /> Enabled</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-[#848e9c]">Disabled</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#848e9c] line-clamp-2">
                A custom code that will appear in all official emails from Korixa to prevent phishing attacks.
              </p>
              <div className="mt-4 flex gap-3">
                <button className="text-xs font-semibold text-primary hover:text-white transition">
                  {security?.antiPhishingCode ? "Update Code" : "Create Code"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Whitelist */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiLock size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Withdrawal Whitelist</h3>
                {security?.withdrawalWhitelistEnabled ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-green-500"><FiCheck /> Enabled</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-[#848e9c]">Disabled</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#848e9c] line-clamp-2">
                When enabled, withdrawals are only permitted to wallet addresses saved in your whitelist.
              </p>
              <div className="mt-4 flex gap-3">
                <button className="text-xs font-semibold text-primary hover:text-white transition">Manage Whitelist</button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Protection (Danger) */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 lg:col-span-2 mt-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <FiLogOut size={18} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-500">Account Protection</h3>
              <p className="mt-1 text-xs text-[#848e9c]">
                If you notice suspicious activity, you can immediately freeze your account or lock all withdrawals.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition">
                  Freeze Account
                </button>
                <button className="rounded border border-red-500/30 px-4 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 transition">
                  Lock Withdrawals
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
