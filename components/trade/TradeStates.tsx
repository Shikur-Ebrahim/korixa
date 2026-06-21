"use client";

import { appTheme } from "@/components/layout/app-theme";

export function TradeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className={`${appTheme.card} h-24`} />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${appTheme.card} h-16 flex-1`} />
        ))}
      </div>
      <div className={`${appTheme.card} h-64`} />
      <div className="grid grid-cols-2 gap-3">
        <div className={`${appTheme.card} h-48`} />
        <div className={`${appTheme.card} h-48`} />
      </div>
    </div>
  );
}

export function TradeErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={`${appTheme.card} py-10 text-center`}>
      <p className="text-sm font-medium text-white">Unable to load market data</p>
      <p className="mt-1 text-xs text-[#848e9c]">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${appTheme.btnPrimary} mt-4`}>
          Retry
        </button>
      )}
    </div>
  );
}

export function TradeEmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-xs text-[#848e9c]">{message}</div>
  );
}
