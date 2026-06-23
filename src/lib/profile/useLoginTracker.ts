"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordLoginEvent } from "@/lib/profile/device-actions";

function getDeviceInfo() {
  const ua = navigator.userAgent;

  // Browser detection
  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  // OS detection
  let os = "Unknown";
  if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  // Device type
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (/Tablet|iPad/.test(ua)) deviceType = "tablet";
  else if (/Mobile|Android|iPhone/.test(ua)) deviceType = "mobile";

  return { browser, os, deviceType };
}

export function useLoginTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Only track once per session using sessionStorage
    const sessionKey = `login_tracked_${user.uid}`;
    if (sessionStorage.getItem(sessionKey)) return;

    async function track() {
      try {
        const token = await user!.getIdToken();
        const { browser, os, deviceType } = getDeviceInfo();

        // Determine auth method from Firebase provider data
        const providerData = user!.providerData;
        const method: "google" | "email_otp" =
          providerData.some((p) => p.providerId === "google.com")
            ? "google"
            : "email_otp";

        // Fetch IP + location from free public API
        let ipAddress = "Unknown";
        let location = "Unknown";
        try {
          const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
          if (res.ok) {
            const data = await res.json();
            ipAddress = data.ip ?? "Unknown";
            location = [data.city, data.country_name].filter(Boolean).join(", ") || "Unknown";
          }
        } catch {
          // geo fetch failed, use defaults
        }

        await recordLoginEvent(token, { browser, os, deviceType, ipAddress, location, method });
        sessionStorage.setItem(sessionKey, "1");
      } catch {
        // silently ignore
      }
    }

    void track();
  }, [user]);
}
