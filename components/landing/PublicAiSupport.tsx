"use client";

import { useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { SupportDrawer } from "@/components/layout/SupportDrawer";

export function PublicAiSupport() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[90] flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 shadow-2xl shadow-primary/30 transition hover:scale-105 active:scale-95"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b0e11] overflow-hidden">
          <img src="/support.png" alt="AI" className="h-4 w-4 object-contain" />
        </div>
        <span className="text-sm font-bold text-[#0b0e11]">Ask AI</span>
      </button>

      <SupportDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
