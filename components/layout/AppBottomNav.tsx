"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiCreditCard, FiHome, FiPieChart, FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

const TABS = [
  { id: "home", href: "/dashboard", label: "Home", icon: FiHome },
  { id: "market", href: "/market", label: "Market", icon: FiTrendingUp },
  { id: "card", href: "/card", label: "Card", icon: FiCreditCard },
  { id: "trade", href: "/trade", label: "Trade", icon: FiRefreshCw },
  { id: "assets", href: "/assets", label: "Assets", icon: FiPieChart },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className={appTheme.bottomNav}>
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition ${
                active ? appTheme.navActive : appTheme.navIdle
              }`}
            >
              <Icon className={`text-lg ${active ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "text-primary" : ""}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-1 h-0.5 w-5 rounded-full bg-primary" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
