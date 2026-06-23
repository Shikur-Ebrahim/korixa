"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getLoginHistory } from "@/lib/profile/device-actions";
import type { LoginLog } from "@/lib/profile/types";
import { appTheme } from "@/components/layout/app-theme";
import {
  FiArrowLeft,
  FiActivity,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";
import { FaGoogle } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MethodIcon({ method }: { method: LoginLog["method"] }) {
  if (method === "google") return <FaGoogle size={12} className="text-[#4285F4]" />;
  return <MdEmail size={14} className="text-primary" />;
}

export default function ActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const list = await getLoginHistory(token);
      setLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className={`${appTheme.page} relative min-h-screen pb-20`}>
      <div className="mx-auto w-full max-w-2xl px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/profile/security")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-white hover:bg-white/[0.08] transition"
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold">Login History</h1>
            <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
              Last {logs.length} login event{logs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-[10px] md:text-xs text-[#848e9c]">
            Showing your last <span className="text-white font-semibold">20</span> login events. If you notice any suspicious activity, go to{" "}
            <button
              onClick={() => router.push("/profile/security")}
              className="text-primary font-semibold underline"
            >
              Security Center
            </button>{" "}
            and enable MFA immediately.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse h-20 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiActivity size={40} className="text-[#848e9c] mb-4" />
            <p className="text-sm font-bold text-white mb-1">No login history yet</p>
            <p className="text-xs text-[#848e9c]">Login events are recorded automatically from this session onwards.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5"
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${log.status === "success" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {log.status === "success" ? (
                      <FiCheck size={14} className="text-green-500" />
                    ) : (
                      <FiXCircle size={14} className="text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${log.status === "success" ? "text-green-500" : "text-red-500"}`}>
                            {log.status === "success" ? "Login Successful" : "Login Failed"}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] md:text-xs text-[#848e9c] bg-white/[0.04] px-1.5 py-0.5 rounded">
                            <MethodIcon method={log.method} />
                            {log.method === "google" ? "Google" : "Email OTP"}
                          </span>
                        </div>
                        <p className="text-[10px] md:text-xs text-[#848e9c] mt-1">
                          {log.browser} · {log.os}
                        </p>
                        <p className="text-[10px] md:text-xs text-[#848e9c]">
                          {log.location} · {log.ipAddress}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[8px] md:text-[10px] text-[#848e9c]">{timeAgo(log.time)}</p>
                        <p className="text-[8px] md:text-[10px] text-[#848e9c] mt-0.5">{formatDate(log.time)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
