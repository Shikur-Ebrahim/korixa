"use client";

import { FiUsers, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { appTheme } from "@/components/layout/app-theme";

export function P2PCard() {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push("/p2p")}
      className={`${appTheme.card} cursor-pointer transition duration-200 hover:border-primary/40 hover:bg-[#1e2329] active:scale-[0.98]`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FiUsers className="text-lg" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">P2P Trading</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#848e9c]">
            Buy or sell USDT safely with verified merchants using Telebirr, CBE &amp; more.
          </p>
        </div>
        <FiArrowRight className="shrink-0 text-[#848e9c]" />
      </div>
    </div>
  );
}
