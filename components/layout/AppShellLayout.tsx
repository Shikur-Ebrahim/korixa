"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { AppMobileHeader } from "@/components/layout/AppMobileHeader";
import { NotificationsDrawer } from "@/components/layout/NotificationsDrawer";
import { appTheme } from "@/components/layout/app-theme";

export function AppShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const hideBottomNav = pathname.startsWith("/kyc");

  return (
    <div className={appTheme.page}>
      <AppMobileHeader
        onNotificationsClick={() => {
          setNotificationsOpen(true);
        }}
      />
      <main className={hideBottomNav ? "mx-auto max-w-lg px-4 pb-6 pt-16" : appTheme.main}>
        {children}
      </main>
      {!hideBottomNav && <AppBottomNav />}
      <NotificationsDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
}
