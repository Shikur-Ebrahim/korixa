"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import type { VirtualCardConfig } from "@/components/landing/virtual-card/card-data";

function CardChip({ tone = "gold" }: { tone?: "gold" | "silver" | "dark" }) {
  const tones = {
    gold: "border-amber-300/30 from-amber-200/90 to-amber-500/70",
    silver: "border-white/40 from-slate-200/90 to-slate-400/70",
    dark: "border-white/20 from-zinc-600/90 to-zinc-800/70",
  };

  return (
    <div
      className={`relative h-8 w-10 overflow-hidden rounded-md border bg-gradient-to-br shadow-inner sm:h-9 sm:w-11 ${tones[tone]}`}
    >
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-px p-1 opacity-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-sm bg-black/20" />
        ))}
      </div>
    </div>
  );
}

function NetworkDots() {
  return (
    <div className="flex items-center">
      <div className="h-4 w-4 rounded-full bg-red-400/80 sm:h-5 sm:w-5" />
      <div className="-ml-2 h-4 w-4 rounded-full bg-amber-400/80 sm:h-5 sm:w-5" />
    </div>
  );
}

function PlatinumPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 8px, rgba(255,255,255,0.15) 8px, rgba(255,255,255,0.15) 9px)`,
      }}
    />
  );
}

function MidnightPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 18 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 24 + (row % 2) * 12}
            y={row * 22}
            width="14"
            height="4"
            rx="2"
            fill="white"
            transform={`rotate(${(row + col) * 8} ${col * 24 + 7} ${row * 22 + 2})`}
          />
        ))
      )}
    </svg>
  );
}

function AuroraGlow() {
  return (
    <>
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-cyan-400/30 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-purple-500/30 blur-2xl" />
    </>
  );
}

function SunsetPattern() {
  return (
    <>
      <div className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-orange-400/25 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
        }}
      />
    </>
  );
}

function EmeraldPattern() {
  return (
    <>
      <div className="pointer-events-none absolute -left-6 -top-6 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-tl-full bg-teal-300/10" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
        viewBox="0 0 400 250"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx={50 + i * 45} cy={125} r="30" fill="none" stroke="white" strokeWidth="0.5" />
        ))}
      </svg>
    </>
  );
}

function CobaltPattern() {
  return (
    <>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-sky-400/15 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.08) 12px, rgba(255,255,255,0.08) 13px)",
        }}
      />
    </>
  );
}

function CrimsonPattern() {
  return (
    <>
      <div className="pointer-events-none absolute -left-8 bottom-0 h-36 w-36 rounded-full bg-rose-500/20 blur-2xl" />
      <div className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full border border-white/10" />
    </>
  );
}

function VioletPattern() {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)",
        }}
      />
    </>
  );
}

type VirtualCardFaceProps = {
  card: VirtualCardConfig;
  active?: boolean;
};

export function VirtualCardFace({ card, active = false }: VirtualCardFaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 28,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 260,
    damping: 28,
  });

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!active) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles = {
    platinum: {
      shell: "border-white/40 bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 shadow-[0_20px_50px_rgba(148,163,184,0.35)]",
      text: "text-slate-800",
      muted: "text-slate-600",
      chip: "silver" as const,
    },
    midnight: {
      shell: "border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
      text: "text-white",
      muted: "text-white/50",
      chip: "gold" as const,
    },
    aurora: {
      shell: "border-white/20 bg-gradient-to-br from-blue-900/90 via-purple-900/85 to-cyan-800/80 shadow-[0_20px_50px_rgba(59,130,246,0.35)] backdrop-blur-xl",
      text: "text-white",
      muted: "text-white/60",
      chip: "gold" as const,
    },
    sunset: {
      shell: "border-orange-400/30 bg-gradient-to-br from-orange-600 via-amber-500 to-red-600 shadow-[0_20px_50px_rgba(249,115,22,0.4)]",
      text: "text-white",
      muted: "text-white/70",
      chip: "gold" as const,
    },
    emerald: {
      shell: "border-emerald-400/25 bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 shadow-[0_20px_50px_rgba(16,185,129,0.35)]",
      text: "text-white",
      muted: "text-emerald-100/60",
      chip: "dark" as const,
    },
    cobalt: {
      shell: "border-sky-400/30 bg-gradient-to-br from-blue-950 via-indigo-900 to-sky-800 shadow-[0_20px_50px_rgba(14,165,233,0.35)]",
      text: "text-white",
      muted: "text-sky-100/60",
      chip: "silver" as const,
    },
    crimson: {
      shell: "border-rose-400/30 bg-gradient-to-br from-rose-950 via-red-900 to-rose-800 shadow-[0_20px_50px_rgba(244,63,94,0.35)]",
      text: "text-white",
      muted: "text-rose-100/60",
      chip: "gold" as const,
    },
    violet: {
      shell: "border-fuchsia-400/30 bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-800 shadow-[0_20px_50px_rgba(192,132,252,0.35)]",
      text: "text-white",
      muted: "text-fuchsia-100/60",
      chip: "dark" as const,
    },
  };

  const style = variantStyles[card.variant];

  return (
    <div
      ref={containerRef}
      className="relative aspect-[1.586/1] w-[260px] shrink-0 sm:w-[300px] md:w-[340px]"
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative h-full w-full"
        style={{ rotateX: active ? rotateX : 0, rotateY: active ? rotateY : 0, transformStyle: "preserve-3d" }}
        animate={{ scale: active ? 1 : 0.92, opacity: active ? 1 : 0.65 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        <div
          className={`relative h-full w-full overflow-hidden rounded-2xl border sm:rounded-3xl ${style.shell}`}
        >
          {card.variant === "platinum" && <PlatinumPattern />}
          {card.variant === "midnight" && <MidnightPattern />}
          {card.variant === "aurora" && <AuroraGlow />}
          {card.variant === "sunset" && <SunsetPattern />}
          {card.variant === "emerald" && <EmeraldPattern />}
          {card.variant === "cobalt" && <CobaltPattern />}
          {card.variant === "crimson" && <CrimsonPattern />}
          {card.variant === "violet" && <VioletPattern />}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

          <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.15em] sm:text-xs ${style.text}`}>
                  Korixa
                </p>
                <p className={`mt-0.5 text-[11px] font-medium sm:text-xs ${style.muted}`}>
                  {card.label}
                </p>
              </div>
              <CardChip tone={style.chip} />
            </div>

            {card.variant === "midnight" && (
              <p className={`text-right text-lg font-light tracking-wider sm:text-xl ${style.text}`}>
                Premium
              </p>
            )}

            {card.variant === "aurora" && (
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full border border-cyan-400/40 bg-cyan-500/10" />
              </div>
            )}

            {card.variant === "sunset" && (
              <p className={`text-center text-sm font-semibold tracking-[0.2em] sm:text-base ${style.text}`}>
                GLOBAL
              </p>
            )}

            {card.variant === "emerald" && (
              <p className={`text-right text-sm font-light italic sm:text-base ${style.muted}`}>
                Elite Member
              </p>
            )}

            {card.variant === "cobalt" && (
              <p className={`text-center text-xs font-medium tracking-[0.25em] sm:text-sm ${style.muted}`}>
                OCEAN PAY
              </p>
            )}

            {card.variant === "crimson" && (
              <p className={`text-left text-sm font-semibold tracking-widest sm:text-base ${style.text}`}>
                SIGNATURE
              </p>
            )}

            {card.variant === "violet" && (
              <div className="flex justify-end">
                <div className="h-10 w-10 rounded-full border border-fuchsia-300/30 bg-white/5" />
              </div>
            )}

            <div className="space-y-3">
              <p className={`font-mono text-sm tracking-[0.1em] sm:text-base ${style.text}`}>
                {card.number}
              </p>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className={`text-[9px] uppercase tracking-wider ${style.muted}`}>Card Holder</p>
                  <p className={`text-[11px] font-medium uppercase sm:text-xs ${style.text}`}>
                    {card.holder}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[9px] uppercase tracking-wider ${style.muted}`}>Expires</p>
                  <p className={`text-[11px] font-medium sm:text-xs ${style.text}`}>{card.expiry}</p>
                </div>
                <NetworkDots />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
