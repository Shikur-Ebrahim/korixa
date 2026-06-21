"use client";

import type { AllocationSlice } from "@/lib/assets/types";
import { appTheme } from "@/components/layout/app-theme";

type AllocationChartProps = {
  slices: AllocationSlice[];
  loading?: boolean;
  hideBalance?: boolean;
};

function DonutChart({ slices }: { slices: AllocationSlice[] }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="h-36 w-36 shrink-0">
      <circle cx="50" cy="50" r={radius} fill="none" stroke="#0b0e11" strokeWidth="12" />
      {slices.map((slice) => {
        const dash = (slice.percent / 100) * circumference;
        const segment = (
          <circle
            key={slice.key}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth="12"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
            className="transition-all duration-500"
          />
        );
        offset += dash;
        return segment;
      })}
      <circle cx="50" cy="50" r="28" fill="#161a1e" />
    </svg>
  );
}

export function AllocationChart({ slices, loading, hideBalance }: AllocationChartProps) {
  if (loading) {
    return (
      <div className={`${appTheme.card} animate-pulse p-5`}>
        <div className="mb-4 h-4 w-32 rounded bg-white/5" />
        <div className="flex items-center gap-4">
          <div className="h-36 w-36 rounded-full bg-white/5" />
          <div className="flex-1 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-3 rounded bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (slices.length === 0) return null;

  return (
    <div className={`${appTheme.card} p-5 transition duration-300`}>
      <h2 className={`${appTheme.sectionTitle} mb-4`}>Asset Allocation</h2>
      <div className="flex items-center gap-4">
        <DonutChart slices={slices} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {slices.map((slice) => (
            <div key={slice.key} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-xs font-medium text-white">{slice.label}</span>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-white">
                  {hideBalance ? "•••" : `${slice.percent.toFixed(1)}%`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
