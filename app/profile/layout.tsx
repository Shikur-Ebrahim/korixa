"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiUser, FiShield, FiMonitor, FiActivity, FiSettings, FiBell, FiGift, FiHelpCircle } from "react-icons/fi";

const PROFILE_LINKS = [
  { label: "Overview", href: "/profile", icon: FiUser },
  { label: "Security Center", href: "/profile/security", icon: FiShield },
  { label: "Device Management", href: "/profile/devices", icon: FiMonitor },
  { label: "Login Activity", href: "/profile/activity", icon: FiActivity },
  { label: "Preferences", href: "/profile/settings", icon: FiSettings },
  { label: "Notifications", href: "/profile/notifications", icon: FiBell },
  { label: "Referral Program", href: "/profile/referrals", icon: FiGift },
  { label: "Support", href: "/profile/support", icon: FiHelpCircle },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0b0e11] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col md:flex-row p-4 md:p-6 gap-6">
        
        {/* Sidebar (Desktop) / Scrollable Tabs (Mobile) */}
        <aside className="w-full md:w-64 shrink-0 overflow-x-auto scrollbar-hide border-b border-white/[0.04] md:border-b-0 pb-2 md:pb-0">
          <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0">
            {PROFILE_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs md:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-[#848e9c] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <link.icon className="text-base" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
