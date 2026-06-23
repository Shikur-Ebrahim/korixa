"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserProfile, initializeUserProfile, getUserSecurity } from "@/lib/profile/service";
import type { UserProfile, UserSecurity } from "@/lib/profile/types";
import { FiShield, FiCheckCircle, FiCopy, FiCheck, FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import { appTheme } from "@/components/layout/app-theme";

export default function ProfileDashboard() {
  const { user, kycStatus } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [security, setSecurity] = useState<UserSecurity | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        let p = await getUserProfile(user.uid);
        if (!p) {
          p = await initializeUserProfile(user);
        }
        setProfile(p);
        
        const s = await getUserSecurity(user.uid);
        setSecurity(s);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex animate-pulse flex-col gap-6">
        <div className="h-48 rounded-2xl bg-white/[0.02]"></div>
        <div className="h-32 rounded-2xl bg-white/[0.02]"></div>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const scoreColor = (profile?.securityScore ?? 0) >= 80 
    ? "text-green-500" 
    : (profile?.securityScore ?? 0) >= 50 
      ? "text-yellow-500" 
      : "text-red-500";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl md:text-2xl font-bold">Profile Overview</h1>

      {/* Main Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] to-[#0b0e11] p-6 shadow-lg">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/15 text-3xl font-bold text-primary ring-4 ring-primary/20">
            {profile?.profileImage ? (
              <img src={profile.profileImage} alt="Avatar" className="rounded-full h-full w-full object-cover" />
            ) : (
              profile?.email?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <h2 className="truncate text-xl font-bold text-white">
              {profile?.fullName || profile?.username || "Korixa User"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-[#848e9c]">
              <span>{profile?.email}</span>
              <span className="hidden md:inline">•</span>
              <span 
                className="flex cursor-pointer items-center gap-1 rounded bg-[#1e2329] px-2 py-1 font-mono hover:text-white"
                onClick={() => handleCopy(profile?.uid ?? "")}
              >
                UID: {profile?.uid?.slice(0, 8)}...
                {copiedUid ? <FiCheck className="text-green-500" /> : <FiCopy />}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide
                ${kycStatus === "verified" ? "border-green-500/30 bg-green-500/10 text-green-500" : "border-primary/30 bg-primary/10 text-primary"}`}>
                <FiShield size={12} />
                {kycStatus}
              </span>
              <span className="rounded-full border border-[#f5b300]/30 bg-[#f5b300]/10 px-2 py-0.5 text-[10px] md:text-xs font-bold text-[#f5b300]">
                VIP {profile?.vipLevel ?? 0}
              </span>
              {profile?.country && (
                <span className="rounded-full bg-[#1e2329] px-2 py-0.5 text-[10px] md:text-xs font-medium text-[#848e9c]">
                  {profile.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Dashboard Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold">Security Score</h3>
            <p className="text-xs md:text-sm text-[#848e9c]">Protect your funds by enabling all security features.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className={`text-2xl font-bold ${scoreColor}`}>{profile?.securityScore ?? 0}<span className="text-sm text-[#848e9c]">/100</span></p>
              <p className="text-xs text-[#848e9c] uppercase tracking-wider font-semibold">
                {(profile?.securityScore ?? 0) >= 80 ? "High" : (profile?.securityScore ?? 0) >= 50 ? "Medium" : "Low"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SecurityFeature 
            icon={FiCheckCircle} 
            title="Email Verification" 
            enabled={security?.emailVerified ?? false}
            href="/profile/security"
          />
          <SecurityFeature 
            icon={FiCheckCircle} 
            title="Recovery Codes" 
            enabled={security?.recoveryCodesGenerated ?? false}
            href="/profile/security"
          />
          <SecurityFeature 
            icon={FiShield} 
            title="Google Auth (2FA)" 
            enabled={security?.mfaEnabled ?? false}
            href="/profile/security"
          />
          <SecurityFeature 
            icon={FiAlertTriangle} 
            title="Anti-Phishing Code" 
            enabled={!!security?.antiPhishingCode}
            href="/profile/security"
          />
        </div>
      </div>
    </div>
  );
}

function SecurityFeature({ icon: Icon, title, enabled, href }: { icon: any, title: string, enabled: boolean, href: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0b0e11] p-4 transition-colors hover:border-white/[0.1]">
      <div className="flex items-center gap-3">
        <Icon className={`text-xl ${enabled ? "text-green-500" : "text-[#848e9c]"}`} />
        <span className="text-xs md:text-sm font-semibold">{title}</span>
      </div>
      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${enabled ? "text-green-500" : "text-primary"}`}>
        {enabled ? "Setup" : "Enable"}
      </span>
    </Link>
  );
}
