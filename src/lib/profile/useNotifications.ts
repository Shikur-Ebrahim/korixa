import { useState, useEffect, useCallback } from "react";
import { subscribeTransactions, TransactionRecord } from "@/lib/profile/wallet-service";
import { useAuth } from "@/components/auth/AuthProvider";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TransactionRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lastReadNotificationTime");
      if (stored) setLastReadTime(parseInt(stored, 10));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTransactions(user.uid, undefined, 20, (data) => {
      setNotifications(data);
      let count = 0;
      for (const tx of data) {
        if (tx.timestamp > lastReadTime) count++;
      }
      setUnreadCount(count);
    });
    return () => unsub();
  }, [user, lastReadTime]);

  const markAllAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTime(now);
    setUnreadCount(0);
    if (typeof window !== "undefined") {
      localStorage.setItem("lastReadNotificationTime", now.toString());
    }
  }, []);

  return { notifications, unreadCount, markAllAsRead };
}
