"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  TradingSettings,
  DEFAULT_TRADING_SETTINGS,
  subscribeTradingSettings,
  updateTradingSettings,
} from "@/lib/profile/trading-settings-service";

export function useTradingSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_TRADING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeTradingSettings(user.uid, (s) => {
      setSettings(s);
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const update = async (updates: Partial<TradingSettings>) => {
    if (!user?.uid) return;
    // Optimistic update
    setSettings((prev) => ({ ...prev, ...updates }));
    await updateTradingSettings(user.uid, updates);
  };

  return { settings, loading, update };
}
