"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { appTheme } from "@/components/layout/app-theme";

export function DashboardOverview() {
  const { user, kycStatus } = useAuth();

  return (
    <div>
      <div className="mb-5">
        <h1 className={appTheme.title}>Dashboard</h1>
        <p className={appTheme.subtitle}>
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className={appTheme.card}>
          <p className={appTheme.cardMuted}>Portfolio value</p>
          <p className={appTheme.cardValue}>$0.00</p>
        </div>
        <div className={appTheme.card}>
          <p className={appTheme.cardMuted}>KYC status</p>
          <p className={`${appTheme.cardValue} capitalize`}>{kycStatus}</p>
        </div>
        <div className={appTheme.card}>
          <p className={appTheme.cardMuted}>24h PnL</p>
          <p className={`${appTheme.cardValue} text-secondary`}>+0.00%</p>
        </div>
      </div>
    </div>
  );
}
