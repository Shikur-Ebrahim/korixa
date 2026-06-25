"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiEye,
  FiCheckCircle,
  FiList,
  FiRepeat,
  FiBell,
  FiBarChart2,
  FiAlertTriangle,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTradingSettings } from "@/hooks/useTradingSettings";
import { TradingSettings } from "@/lib/profile/trading-settings-service";
import { DEFAULT_PAIRS, CHART_INTERVALS } from "@/lib/binance/types";

// ─── Reusable Toggle ────────────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        value ? "bg-primary" : "bg-white/10"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          value ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Reusable Select ────────────────────────────────────────────────────────
function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-white/[0.08] bg-[#1e2329] px-3 py-2.5 text-[15px] font-semibold text-white focus:border-primary focus:outline-none transition-all"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Row Component ───────────────────────────────────────────────────────────
function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
          <Icon size={17} className="text-[#848e9c]" />
        </div>
        <div className="min-w-0">
          <p className="text-[17px] font-semibold text-white leading-tight">{label}</p>
          <p className="mt-1 text-[14px] text-[#848e9c] leading-snug">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
      <div className="px-5 pt-5 pb-1">
        <p className="text-[14px] font-bold uppercase tracking-widest text-[#848e9c]">{title}</p>
      </div>
      <div className="divide-y divide-white/[0.04] px-5">{children}</div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonSection() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 space-y-5 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/5" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-white/5" />
            <div className="h-3 w-48 rounded bg-white/5" />
          </div>
          <div className="h-7 w-12 rounded-full bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TradingSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, loading, update } = useTradingSettings();
  const [savedIndicator, setSavedIndicator] = useState(false);

  const handleUpdate = async (key: keyof TradingSettings, value: any) => {
    await update({ [key]: value } as Partial<TradingSettings>);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 1800);
  };

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const pairOptions = DEFAULT_PAIRS.map((p) => ({ value: p.symbol, label: p.label }));
  const timeframeOptions = CHART_INTERVALS.map((c) => ({ value: c.id, label: c.label }));

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] flex flex-col pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#0b0e11]/95 backdrop-blur-sm px-4 pt-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
            >
              <FiArrowLeft size={22} className="text-[#eaecef]" />
            </button>
            <div>
              <h1 className="text-[22px] font-bold text-white tracking-tight">
                Trading Settings
              </h1>
              <p className="text-[14px] text-[#848e9c] mt-0.5">
                Customize your trading preferences.
              </p>
            </div>
          </div>

          {/* Saved indicator */}
          <AnimatePresence>
            {savedIndicator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 text-[13px] font-semibold text-green-400"
              >
                <FiCheckCircle size={14} /> Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-5">
        {loading ? (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        ) : (
          <>
            {/* ── Order Settings ── */}
            <Section title="Order Settings">
              <SettingRow
                icon={FiCheckCircle}
                label="Require Order Confirmation"
                description="Show confirmation before placing buy or sell orders."
              >
                <Toggle
                  value={settings.requireOrderConfirmation}
                  onChange={(v) => handleUpdate("requireOrderConfirmation", v)}
                />
              </SettingRow>

              <SettingRow
                icon={FiList}
                label="Default Order Type"
                description="The order type pre-selected when you open the trade page."
              >
                <Select
                  value={settings.defaultOrderType}
                  onChange={(v) => handleUpdate("defaultOrderType", v)}
                  options={[
                    { value: "market", label: "Market" },
                    { value: "limit", label: "Limit" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                icon={FiRepeat}
                label="Preferred Trading Pair"
                description="Default pair opened when you navigate to the trade page."
              >
                <Select
                  value={settings.defaultTradingPair}
                  onChange={(v) => handleUpdate("defaultTradingPair", v)}
                  options={pairOptions}
                />
              </SettingRow>
            </Section>

            {/* ── Portfolio ── */}
            <Section title="Portfolio">
              <SettingRow
                icon={FiEye}
                label="Hide Small Balances"
                description="Hide assets worth less than $1 from your wallet views."
              >
                <Toggle
                  value={settings.hideSmallBalances}
                  onChange={(v) => handleUpdate("hideSmallBalances", v)}
                />
              </SettingRow>
            </Section>

            {/* ── Chart ── */}
            <Section title="Chart">
              <SettingRow
                icon={FiBarChart2}
                label="Default Chart Timeframe"
                description="The timeframe pre-selected when you open a chart."
              >
                <Select
                  value={settings.chartTimeframe}
                  onChange={(v) => handleUpdate("chartTimeframe", v)}
                  options={timeframeOptions}
                />
              </SettingRow>

              <SettingRow
                icon={FiBarChart2}
                label="Chart Theme"
                description="Visual theme for TradingView charts."
              >
                <Select
                  value={settings.chartTheme}
                  onChange={(v) => handleUpdate("chartTheme", v)}
                  options={[
                    { value: "dark", label: "Dark" },
                    { value: "light", label: "Light" },
                    { value: "system", label: "System" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                icon={FiRefreshCw}
                label="Auto Refresh Market Data"
                description="Automatically refresh live prices and market data."
              >
                <Toggle
                  value={settings.autoRefreshMarketData}
                  onChange={(v) => handleUpdate("autoRefreshMarketData", v)}
                />
              </SettingRow>
            </Section>

            {/* ── Notifications ── */}
            <Section title="Notifications">
              <SettingRow
                icon={FiBell}
                label="Price Alerts"
                description="Get notified when assets hit your target prices."
              >
                <Toggle
                  value={settings.priceAlerts}
                  onChange={(v) => handleUpdate("priceAlerts", v)}
                />
              </SettingRow>

              <SettingRow
                icon={FiBarChart2}
                label="Market Notifications"
                description="Receive alerts for price spikes and market opportunities."
              >
                <Toggle
                  value={settings.marketNotifications}
                  onChange={(v) => handleUpdate("marketNotifications", v)}
                />
              </SettingRow>

              <SettingRow
                icon={FiRepeat}
                label="P2P Notifications"
                description="Order alerts, payment received, and release reminders."
              >
                <Toggle
                  value={settings.p2pNotifications}
                  onChange={(v) => handleUpdate("p2pNotifications", v)}
                />
              </SettingRow>
            </Section>

            {/* ── Risk & Safety ── */}
            <Section title="Risk & Safety">
              <SettingRow
                icon={FiAlertTriangle}
                label="Risk Warning Popups"
                description="Show important risk warnings before high-risk actions."
              >
                <Toggle
                  value={settings.riskWarnings}
                  onChange={(v) => handleUpdate("riskWarnings", v)}
                />
              </SettingRow>
            </Section>

            {/* Info note */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
              <div className="flex items-start gap-3">
                <FiShield size={18} className="mt-0.5 shrink-0 text-primary" />
                <p className="text-[14px] text-[#848e9c] leading-relaxed">
                  All settings are saved instantly to your account and will apply across all your devices in real time.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
