"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { AppMobileHeader } from "@/components/layout/AppMobileHeader";
import { NotificationsDrawer } from "@/components/layout/NotificationsDrawer";
import { ProfileDrawer } from "@/components/layout/ProfileDrawer";
import { DepositDrawer } from "@/components/layout/DepositDrawer";
import { SupportDrawer } from "@/components/layout/SupportDrawer";
import { appTheme } from "@/components/layout/app-theme";
import { useLoginTracker } from "@/lib/profile/useLoginTracker";
import { useNotifications } from "@/lib/profile/useNotifications";

export function AppShellLayout({ children }: { children: ReactNode }) {
  useLoginTracker();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { notifications, unreadCount, readIds, markAsRead, markAllAsRead } = useNotifications();

  // Auto-open drawers from query params
  useEffect(() => {
    let changed = false;
    if (searchParams.get("profile") === "open") {
      setProfileOpen(true);
      changed = true;
    }
    if (searchParams.get("deposit") === "open") {
      setDepositOpen(true);
      changed = true;
    }
    if (changed) {
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const hideBottomNav = pathname.startsWith("/kyc");

  return (
    <div className={appTheme.page}>
      <AppMobileHeader
        onProfileClick={() => {
          setNotificationsOpen(false);
          setSupportOpen(false);
          setProfileOpen(true);
        }}
        onNotificationsClick={() => {
          setProfileOpen(false);
          setSupportOpen(false);
          setNotificationsOpen(true);
        }}
        onSupportClick={() => {
          setProfileOpen(false);
          setNotificationsOpen(false);
          setSupportOpen(true);
        }}
        unreadCount={unreadCount}
      />
      <main className={hideBottomNav ? "mx-auto max-w-lg px-4 pb-6 pt-16" : appTheme.main}>
        {children}
      </main>
      {!hideBottomNav && <AppBottomNav />}
      <ProfileDrawer 
        open={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        onOpenNotifications={() => {
          setProfileOpen(false);
          setNotificationsOpen(true);
        }}
      />
      <NotificationsDrawer 
        open={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
        notifications={notifications} 
        readIds={readIds}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
      />
      <DepositDrawer open={depositOpen} onClose={() => setDepositOpen(false)} />
      <SupportDrawer open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
