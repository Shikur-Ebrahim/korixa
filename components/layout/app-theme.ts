/** Mobile-first dark crypto theme for authenticated app pages */
export const appTheme = {
  page: "min-h-screen bg-[#0b0e11] text-white",
  main: "mx-auto max-w-lg px-4 pb-24 pt-16",
  header:
    "fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0b0e11]/95 backdrop-blur-md",
  bottomNav:
    "fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-[#161a1e]/98 backdrop-blur-md pb-[env(safe-area-inset-bottom)]",
  title: "text-xl md:text-2xl font-bold text-white",
  subtitle: "mt-1 text-[10px] md:text-xs text-[#848e9c]",
  sectionTitle: "text-xs md:text-sm font-bold text-white",
  card: "rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 md:p-5",
  cardMuted: "text-[10px] md:text-xs text-[#848e9c]",
  cardValue: "mt-1 text-lg md:text-xl font-semibold text-white",
  input:
    "w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] px-3 py-3 text-xs md:text-sm text-white outline-none placeholder:text-white/20 focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
  btnOutline:
    "rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-2.5 text-[10px] md:text-xs font-bold text-white transition hover:bg-white/[0.04]",
  btnPrimary: "rounded-xl bg-primary px-4 py-2.5 text-[10px] md:text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90",
  linkMuted: "text-[10px] md:text-xs font-bold text-[#848e9c] transition hover:text-white",
  navActive: "text-primary",
  navIdle: "text-[#848e9c]",
  positive: "text-green-500",
  negative: "text-red-500",
} as const;
