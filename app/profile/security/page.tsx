"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserSecurity, getUserProfile } from "@/lib/profile/service";
import type { UserSecurity, UserProfile } from "@/lib/profile/types";
import { generateMfaSecret, verifyAndEnableMfa, generateRecoveryCodes, updateAntiPhishingCode } from "@/lib/profile/security-actions";
import QRCode from "qrcode";
import { FiCheck, FiMail, FiShield, FiAlertTriangle, FiKey, FiLock, FiLogOut, FiMonitor, FiActivity, FiFileText, FiArrowLeft, FiX, FiCopy, FiUserCheck } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

function calculateSecurityScore(security: UserSecurity | null, profile: UserProfile | null) {
  let score = 0;
  if (!security) return score;

  if (security.emailVerified) score += 15;
  if (profile?.kycStatus === "verified") score += 30;
  if (security.mfaEnabled) score += 30;
  if (security.recoveryCodesGenerated) score += 15;
  if (security.antiPhishingCode) score += 10;
  
  return Math.min(score, 100);
}

export default function SecurityCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [security, setSecurity] = useState<UserSecurity | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showPhishingModal, setShowPhishingModal] = useState(false);

  // MFA State
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaCodeInput, setMfaCodeInput] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

  // Recovery State
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Phishing State
  const [phishingInput, setPhishingInput] = useState("");
  const [phishingLoading, setPhishingLoading] = useState(false);

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

  useEffect(() => {
    void loadData();
  }, [user]);

  // Actions
  const handleEnableMfaClick = async () => {
    if (!user) return;
    setMfaLoading(true);
    try {
      const token = await user.getIdToken();
      const { secret, otpauthUrl } = await generateMfaSecret(token, user.email || "user@korixa.com");
      setMfaSecret(secret);
      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        // @ts-ignore
        QRCode.toDataURL(otpauthUrl, { margin: 1, width: 200, color: { dark: "#000000", light: "#ffffff" } }, (err: any, url: string) => {
          if (err) reject(err);
          else resolve(url);
        });
      });
      setMfaQrCode(qrDataUrl);
      setShowMfaModal(true);
    } catch (error) {
      console.error(error);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    if (!user || mfaCodeInput.length !== 6) return;
    setMfaLoading(true);
    setMfaError("");
    try {
      const token = await user.getIdToken();
      await verifyAndEnableMfa(token, mfaSecret, mfaCodeInput);
      setShowMfaModal(false);
      await loadData();
    } catch (error: any) {
      setMfaError(error.message || "Invalid code");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleGenerateRecovery = async () => {
    if (!user) return;
    setRecoveryLoading(true);
    try {
      const token = await user.getIdToken();
      const { codes } = await generateRecoveryCodes(token);
      setRecoveryCodes(codes);
      setShowRecoveryModal(true);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSavePhishingCode = async () => {
    if (!user || !phishingInput) return;
    setPhishingLoading(true);
    try {
      const token = await user.getIdToken();
      await updateAntiPhishingCode(token, phishingInput);
      setShowPhishingModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setPhishingLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className={`${appTheme.page} relative min-h-screen pb-20`}>
        <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-col gap-6 animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white/[0.04]" />
            <div className="h-6 w-44 rounded bg-white/[0.04]" />
          </div>
          {/* Score card skeleton */}
          <div className="rounded-2xl bg-white/[0.03] h-40 w-full" />
          {/* Cards grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-xl bg-white/[0.03] h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }


  const score = calculateSecurityScore(security, profile);
  const scoreColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const textColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";

  return (
    <div className={`${appTheme.page} relative min-h-screen pb-20`}>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-col gap-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white hover:bg-white/[0.08] transition"
          >
            <FiArrowLeft size={16} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Security Center</h1>
        </div>

        {/* Security Dashboard Header */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1 w-full">
              <h2 className="text-sm md:text-lg font-bold mb-2">Security Score</h2>
              <div className="flex items-center gap-4 mb-2">
                <span className={`text-2xl md:text-3xl font-bold ${textColor}`}>{score}</span>
                <span className="text-xs md:text-sm text-[#848e9c]">/ 100</span>
              </div>
              
              <div className="h-1.5 md:h-2 w-full bg-white/[0.04] rounded-full overflow-hidden">
                <div className={`h-full ${scoreColor} transition-all duration-1000`} style={{ width: `${score}%` }} />
              </div>
              
              <p className="text-[10px] md:text-xs text-[#848e9c] mt-3">
                Last security check: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex-1 w-full md:pl-6 md:border-l border-white/[0.06]">
              <h3 className="text-xs md:text-sm font-bold text-white mb-3">Recommendations</h3>
              <ul className="space-y-2">
                {!security?.mfaEnabled && (
                  <li className="flex items-center gap-2 text-[10px] md:text-xs text-[#848e9c]">
                    <FiAlertTriangle className="text-yellow-500 shrink-0" /> Enable Google Authenticator (+30)
                  </li>
                )}
                {profile?.kycStatus !== "verified" && (
                  <li className="flex items-center gap-2 text-[10px] md:text-xs text-[#848e9c]">
                    <FiAlertTriangle className="text-yellow-500 shrink-0" /> Complete Identity Verification (+30)
                  </li>
                )}
                {!security?.recoveryCodesGenerated && (
                  <li className="flex items-center gap-2 text-[10px] md:text-xs text-[#848e9c]">
                    <FiAlertTriangle className="text-yellow-500 shrink-0" /> Generate Recovery Codes (+15)
                  </li>
                )}
                {!security?.antiPhishingCode && (
                  <li className="flex items-center gap-2 text-[10px] md:text-xs text-[#848e9c]">
                    <FiAlertTriangle className="text-yellow-500 shrink-0" /> Add Anti-Phishing Code (+10)
                  </li>
                )}
                {score >= 100 && (
                  <li className="flex items-center gap-2 text-[10px] md:text-xs text-green-500">
                    <FiCheck className="shrink-0" /> Your account is fully secured.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* Email Verification */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiMail size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Email Authentication</h3>
                  {user?.emailVerified ? (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500"><FiCheck /> Verified</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-red-500">Unverified</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c] line-clamp-1">{user?.email}</p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  {!user?.emailVerified && (
                    <button className="rounded bg-primary px-3 py-1.5 text-[10px] md:text-xs font-bold text-[#0b0e11] hover:bg-primary/90 transition">
                      Verify Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Verification (KYC) */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full ${profile?.kycStatus === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                <FiUserCheck size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Identity Verification</h3>
                  {profile?.kycStatus === 'verified' ? (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500"><FiCheck /> Verified</span>
                  ) : profile?.kycStatus === 'pending' ? (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-yellow-500">In Review</span>
                  ) : profile?.kycStatus === 'rejected' ? (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-red-500">Rejected</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-[#848e9c]">Unverified</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  {profile?.kycStatus === 'verified'
                    ? 'Your identity has been successfully verified. Security score +30.'
                    : 'Complete KYC to unlock full account features and boost your security score by +30.'}
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  {profile?.kycStatus !== 'verified' && (
                    <button
                      onClick={() => router.push('/kyc')}
                      className="rounded bg-primary px-3 py-1.5 text-[10px] md:text-xs font-bold text-[#0b0e11] hover:bg-primary/90 transition"
                    >
                      {profile?.kycStatus === 'pending' ? 'View Status' : 'Verify Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication (MFA) */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5 lg:col-span-2">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiShield size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Authenticator App (MFA)</h3>
                  {security?.mfaEnabled ? (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500"><FiCheck /> Enabled</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-yellow-500">Recommended</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  Protect your account with Google Authenticator, Authy, or Microsoft Authenticator.
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  {security?.mfaEnabled ? (
                    <button className="rounded bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 text-[10px] md:text-xs font-bold text-white transition pointer-events-none opacity-50">Enabled</button>
                  ) : (
                    <button onClick={handleEnableMfaClick} disabled={mfaLoading} className="rounded bg-primary px-4 py-1.5 text-[10px] md:text-xs font-bold text-[#0b0e11] hover:bg-primary/90 transition disabled:opacity-50">
                      {mfaLoading ? "Loading..." : "Enable MFA"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Codes */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiFileText size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Recovery Codes</h3>
                  {security?.recoveryCodesGenerated ? (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500"><FiCheck /> Saved</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-yellow-500">Missing</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  Generate 10 recovery codes to regain access if you lose your Authenticator App.
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  <button 
                    onClick={handleGenerateRecovery} 
                    disabled={recoveryLoading}
                    className="text-[10px] md:text-xs font-semibold text-primary hover:text-white transition"
                  >
                    {security?.recoveryCodesGenerated ? "Regenerate Codes" : (recoveryLoading ? "Generating..." : "Generate Codes")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Anti-Phishing Code */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiKey size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Anti-Phishing Code</h3>
                  {security?.antiPhishingCode ? (
                    <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500"><FiCheck /> Enabled</span>
                  ) : (
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-[#848e9c]">Disabled</span>
                  )}
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  A custom code that will appear in all official Resend security emails from Korixa.
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  <button 
                    onClick={() => {
                      setPhishingInput(security?.antiPhishingCode || "");
                      setShowPhishingModal(true);
                    }}
                    className="text-[10px] md:text-xs font-semibold text-primary hover:text-white transition"
                  >
                    {security?.antiPhishingCode ? "Update Code" : "Create Code"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Device Management */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiMonitor size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Device Management</h3>
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  Manage trusted devices and active sessions across browsers and mobile apps.
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  <button onClick={() => router.push("/profile/devices")} className="text-[10px] md:text-xs font-semibold text-primary hover:text-white transition">View Devices</button>
                </div>
              </div>
            </div>
          </div>

          {/* Login History */}
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FiActivity size={16} className="md:w-[18px] md:h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs md:text-sm font-bold">Login History</h3>
                </div>
                <p className="mt-1 text-[10px] md:text-xs text-[#848e9c]">
                  Review your recent login activity to detect any unauthorized access.
                </p>
                <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
                  <button onClick={() => router.push("/profile/activity")} className="text-[10px] md:text-xs font-semibold text-primary hover:text-white transition">View History</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MFA Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161a1e] p-6 shadow-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Setup Authenticator</h3>
              <button onClick={() => setShowMfaModal(false)} className="text-[#848e9c] hover:text-white"><FiX size={20} /></button>
            </div>
            <p className="text-xs text-[#848e9c] mb-6">Scan the QR code below with Google Authenticator, Authy, or similar app.</p>
            
            <div className="flex justify-center mb-6 bg-white p-2 rounded-xl w-fit mx-auto">
              {mfaQrCode && <img src={mfaQrCode} alt="QR Code" className="w-40 h-40" />}
            </div>

            <div className="mb-6">
              <p className="text-[10px] text-[#848e9c] mb-1 uppercase font-bold">Or enter setup key manually</p>
              <div className="flex items-center justify-between bg-[#0b0e11] border border-white/[0.08] p-3 rounded-xl">
                <span className="text-xs font-mono text-white tracking-widest">{mfaSecret}</span>
                <button onClick={() => handleCopyText(mfaSecret)} className="text-primary"><FiCopy size={14} /></button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-[#848e9c] mb-1 uppercase font-bold">Enter 6-digit code to verify</p>
              <input 
                type="text" 
                maxLength={6} 
                value={mfaCodeInput}
                onChange={(e) => setMfaCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[#0b0e11] border border-white/[0.08] rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-[0.5em] focus:outline-none focus:border-primary transition"
              />
              {mfaError && <p className="text-red-500 text-[10px] mt-2 text-center">{mfaError}</p>}
            </div>

            <button 
              onClick={handleVerifyMfa}
              disabled={mfaCodeInput.length !== 6 || mfaLoading}
              className="w-full bg-primary text-[#0b0e11] font-bold text-xs py-3.5 rounded-xl mt-6 transition disabled:opacity-50"
            >
              {mfaLoading ? "Verifying..." : "Verify & Enable"}
            </button>
          </div>
        </div>
      )}

      {/* Recovery Codes Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161a1e] p-6 shadow-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Recovery Codes</h3>
              <button onClick={() => setShowRecoveryModal(false)} className="text-[#848e9c] hover:text-white"><FiX size={20} /></button>
            </div>
            <p className="text-xs text-yellow-500 mb-6 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
              Save these codes in a secure place. They will only be shown once. You can use them to recover your account if you lose your MFA device.
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="bg-[#0b0e11] border border-white/[0.08] rounded-lg p-2 text-center text-xs font-mono text-white tracking-wider">
                  {code}
                </div>
              ))}
            </div>

            <button 
              onClick={() => {
                handleCopyText(recoveryCodes.join('\n'));
                setShowRecoveryModal(false);
              }}
              className="w-full bg-primary text-[#0b0e11] font-bold text-xs py-3.5 rounded-xl transition hover:bg-primary/90"
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}

      {/* Anti-Phishing Modal */}
      {showPhishingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#161a1e] p-6 shadow-2xl border border-white/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Anti-Phishing Code</h3>
              <button onClick={() => setShowPhishingModal(false)} className="text-[#848e9c] hover:text-white"><FiX size={20} /></button>
            </div>
            <p className="text-xs text-[#848e9c] mb-6">
              Set a unique code (e.g. 4-20 characters). This code will be included in all official Korixa emails to help you identify fake emails.
            </p>
            
            <div className="mb-6">
              <input 
                type="text" 
                maxLength={20} 
                value={phishingInput}
                onChange={(e) => setPhishingInput(e.target.value)}
                placeholder="Your unique code"
                className="w-full bg-[#0b0e11] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <button 
              onClick={handleSavePhishingCode}
              disabled={phishingInput.length < 4 || phishingLoading}
              className="w-full bg-primary text-[#0b0e11] font-bold text-xs py-3.5 rounded-xl transition disabled:opacity-50 hover:bg-primary/90"
            >
              {phishingLoading ? "Saving..." : "Save Code"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
