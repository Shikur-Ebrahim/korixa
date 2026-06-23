"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDevices, trustDevice, revokeDevice } from "@/lib/profile/device-actions";
import type { UserDevice } from "@/lib/profile/types";
import { appTheme } from "@/components/layout/app-theme";
import {
  FiArrowLeft,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiShield,
  FiTrash2,
  FiCheck,
  FiLoader,
} from "react-icons/fi";

function DeviceIcon({ type }: { type: UserDevice["deviceType"] }) {
  if (type === "mobile") return <FiSmartphone size={18} />;
  if (type === "tablet") return <FiTablet size={18} />;
  return <FiMonitor size={18} />;
}

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

export default function DevicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const list = await getDevices(token);
      setDevices(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const handleTrust = async (deviceId: string) => {
    if (!user) return;
    setActioningId(deviceId);
    try {
      const token = await user.getIdToken();
      await trustDevice(token, deviceId);
      await load();
    } finally {
      setActioningId(null);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!user) return;
    setActioningId(deviceId);
    try {
      const token = await user.getIdToken();
      await revokeDevice(token, deviceId);
      await load();
    } finally {
      setActioningId(null);
    }
  };

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
            <h1 className="text-lg md:text-xl font-bold">Device Management</h1>
            <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
              {devices.length} device{devices.length !== 1 ? "s" : ""} detected
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-24 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FiMonitor size={40} className="text-[#848e9c] mb-4" />
            <p className="text-sm font-bold text-white mb-1">No devices found</p>
            <p className="text-xs text-[#848e9c]">Devices are detected on your next login.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className={`rounded-xl border p-4 md:p-5 bg-[#161a1e] transition ${
                  device.isTrusted ? "border-green-500/20" : "border-white/[0.06]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${device.isTrusted ? "bg-green-500/10 text-green-500" : "bg-white/[0.04] text-[#848e9c]"}`}>
                    <DeviceIcon type={device.deviceType} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="text-xs md:text-sm font-bold text-white">
                          {device.browser} · {device.os}
                        </p>
                        <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
                          {device.location} · {device.ipAddress}
                        </p>
                        <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
                          Last active: {timeAgo(device.lastActive)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {device.isTrusted && (
                          <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-green-500">
                            <FiShield size={10} /> Trusted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-3">
                      {!device.isTrusted && (
                        <button
                          onClick={() => handleTrust(device.id)}
                          disabled={actioningId === device.id}
                          className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-primary hover:text-white transition disabled:opacity-50"
                        >
                          {actioningId === device.id ? <FiLoader size={11} className="animate-spin" /> : <FiCheck size={11} />}
                          Trust Device
                        </button>
                      )}
                      <button
                        onClick={() => handleRevoke(device.id)}
                        disabled={actioningId === device.id}
                        className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-red-500 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {actioningId === device.id ? <FiLoader size={11} className="animate-spin" /> : <FiTrash2 size={11} />}
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        {devices.length > 0 && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-[10px] md:text-xs text-[#848e9c]">
              <span className="text-yellow-500 font-bold">Tip:</span> If you see a device you don&apos;t recognize, remove it immediately and{" "}
              <span className="text-primary font-semibold">enable MFA</span> in the Security Center.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
