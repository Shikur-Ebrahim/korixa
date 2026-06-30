"use client";

import Image from "next/image";
import Link from "next/link";
import { FiBell, FiUser } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

type AppMobileHeaderProps = {
  onProfileClick: () => void;
  onNotificationsClick?: () => void;
  onSupportClick?: () => void;
  unreadCount?: number;
};

export function AppMobileHeader({ onProfileClick, onNotificationsClick, onSupportClick, unreadCount = 0 }: AppMobileHeaderProps) {
  return (
    <header className={appTheme.header}>
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="Open profile"
          className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border border-white/[0.08] bg-[#161a1e] transition hover:bg-white/[0.06]"
        >
          {/* Using standard img tag without loading="lazy" for instant display as requested */}
          <img src="/profile.png" alt="Profile" className="h-full w-full object-cover" />
        </button>

        <Link href="/dashboard" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Image
            src="/app logo.jpg"
            alt="Korixa"
            width={28}
            height={28}
            className="rounded-lg object-cover"
          />
          <span className="text-sm font-bold tracking-tight text-white">Korixa</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSupportClick}
            aria-label="Support Assistant"
            className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border border-white/[0.08] bg-[#161a1e] transition hover:bg-white/[0.06]"
          >
            <img src="/support.png" alt="Support" className="h-5 w-5 object-contain" />
          </button>

          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#161a1e] text-[#eaecef] transition hover:bg-white/[0.06]"
          >
            <FiBell className="text-base" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-black border border-[#161a1e]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
