"use client";

import { useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { SupportDrawer } from "@/components/layout/SupportDrawer";

export function PublicAiSupport() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[90] flex items-center justify-center">
        {/* Pulsing background glow to grab attention */}
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
        
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 shadow-2xl shadow-emerald-500/50 transition hover:scale-105 active:scale-95"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b0e11] overflow-hidden">
            <img src="/support.png" alt="AI" className="h-4 w-4 object-contain" />
          </div>
          <span className="text-sm font-bold text-[#0b0e11]">Ask AI</span>
        </button>
      </div>

      <SupportDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
