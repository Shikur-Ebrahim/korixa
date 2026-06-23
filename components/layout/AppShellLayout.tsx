"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { AppMobileHeader } from "@/components/layout/AppMobileHeader";
import { NotificationsDrawer } from "@/components/layout/NotificationsDrawer";
import { ProfileDrawer } from "@/components/layout/ProfileDrawer";
import { appTheme } from "@/components/layout/app-theme";
import { useLoginTracker } from "@/lib/profile/useLoginTracker";

export function AppShellLayout({ children }: { children: ReactNode }) {
  useLoginTracker();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const hideBottomNav = pathname.startsWith("/kyc");

  return (
    <div className={appTheme.page}>
      <AppMobileHeader
        onProfileClick={() => {
          setNotificationsOpen(false);
          setProfileOpen(true);
        }}
        onNotificationsClick={() => {
          setProfileOpen(false);
          setNotificationsOpen(true);
        }}
      />
      <main className={hideBottomNav ? "mx-auto max-w-lg px-4 pb-6 pt-16" : appTheme.main}>
        {children}
      </main>
      {!hideBottomNav && <AppBottomNav />}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
      <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
