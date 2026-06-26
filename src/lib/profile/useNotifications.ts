import { useState, useEffect, useCallback } from "react";
import { subscribeTransactions, TransactionRecord } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TransactionRecord[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("readNotificationIds");
        if (stored) {
          setReadIds(new Set(JSON.parse(stored)));
        }
      } catch (e) {}
    }
  }, []);

  const saveReadIds = (newSet: Set<string>) => {
    if (typeof window !== "undefined") {
      const arr = Array.from(newSet).slice(-100); // Keep max 100
      localStorage.setItem("readNotificationIds", JSON.stringify(arr));
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTransactions(user.uid, undefined, 30, (data) => {
      setNotifications(data);
    });
    return () => unsub();
  }, [user]);

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return { notifications, unreadCount, readIds, markAsRead, markAllAsRead };
}
