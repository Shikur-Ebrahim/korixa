"use client";

import Image from "next/image";
import Link from "next/link";
import { FiBell, FiUser } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

type AppMobileHeaderProps = {
  onProfileClick: () => void;
  onNotificationsClick?: () => void;
};

export function AppMobileHeader({ onProfileClick, onNotificationsClick }: AppMobileHeaderProps) {
  return (
    <header className={`${appTheme.header} relative`}>
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="Open profile"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#161a1e] text-[#eaecef] transition hover:bg-white/[0.06]"
        >
          <FiUser className="text-base" />
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

        <button
          type="button"
          onClick={onNotificationsClick}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#161a1e] text-[#eaecef] transition hover:bg-white/[0.06]"
        >
          <FiBell className="text-base" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
