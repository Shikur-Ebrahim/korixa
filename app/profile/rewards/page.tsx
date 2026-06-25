"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft, FiCopy, FiCheck, FiGift, FiUsers, FiShare2 } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RewardsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.uid?.substring(0, 8).toUpperCase() || "KORIXA24";
  const referralLink = `https://korixapay.com/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Rewards & Referral</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        {/* Stats Card */}
        <div className="mb-6 rounded-xl md:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] to-[#0b0e11] p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
              <FiGift size={20} />
            </div>
            <div>
              <h2 className="text-xs md:text-sm font-bold text-white">Total Earned</h2>
              <p className="text-[10px] md:text-xs text-[#848e9c]">From referrals & rewards</p>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-2xl md:text-3xl font-bold text-white">0.00</span>
            <span className="text-xs md:text-sm text-[#848e9c] mb-1">USDT</span>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-[10px] md:text-xs text-[#848e9c]">Total Friends</p>
              <p className="text-sm md:text-base font-bold text-white mt-0.5">0</p>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-[#848e9c]">Pending Bonus</p>
              <p className="text-sm md:text-base font-bold text-white mt-0.5">0.00 ETB</p>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="mb-6">
          <h2 className="text-xs md:text-sm font-bold text-white mb-3 px-1">Invite Friends</h2>
          <div className={appTheme.card}>
            <p className="text-[10px] md:text-xs text-[#848e9c] mb-4">
              Share your referral link with friends. When they sign up and complete KYC, you both earn up to 5 USDT!
            </p>
            
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0b0e11] p-1.5 pl-4">
              <span className="text-[10px] md:text-xs font-mono text-white truncate flex-1">
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[10px] md:text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90"
              >
                {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-xs md:text-sm font-bold text-white mb-3 px-1">How it works</h2>
          <div className="space-y-4 rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <FiShare2 size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white">1. Share your link</h3>
                <p className="text-[10px] md:text-xs text-[#848e9c] mt-1">Send your unique referral link to friends.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <FiUsers size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white">2. Friends sign up</h3>
                <p className="text-[10px] md:text-xs text-[#848e9c] mt-1">They register and complete identity verification.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <FiGift size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-white">3. Earn crypto</h3>
                <p className="text-[10px] md:text-xs text-[#848e9c] mt-1">You both receive a crypto bonus instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
