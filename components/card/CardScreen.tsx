"use client";

import { appTheme } from "@/components/layout/app-theme";

export function CardScreen() {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 via-[#d97706] to-[#92400e] p-5 text-[#0b0e11] shadow-lg">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <p className="text-xs font-medium opacity-80">Korixa Card</p>
        <p className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• 4289</p>
        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="text-[10px] opacity-70">Card holder</p>
            <p className="text-sm font-semibold">KORIXA USER</p>
          </div>
          <p className="text-xs font-bold">VISA</p>
        </div>
      </div>

      <div className={`${appTheme.card}`}>
        <p className={appTheme.cardMuted}>Available spend</p>
        <p className={appTheme.cardValue}>$0.00</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className={appTheme.btnPrimary}>
            Top up
          </button>
          <button type="button" className={appTheme.btnOutline}>
            Freeze card
          </button>
        </div>
      </div>

      <div className={`${appTheme.card}`}>
        <p className="mb-3 text-sm font-medium text-white">Recent activity</p>
        <p className="text-center text-xs text-[#848e9c] py-6">No card transactions yet</p>
      </div>
    </div>
  );
}
