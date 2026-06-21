"use client";

import { appTheme } from "@/components/layout/app-theme";

export function DepositHero() {
  return (
    <div className="mb-1">
      <h1 className={appTheme.title}>Deposit</h1>
      <p className={appTheme.subtitle}>Add funds to your Korixa wallet</p>
    </div>
  );
}
