"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiMessageSquare, FiClock, FiUser, FiPhone, FiMapPin, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";

type ContactMsg = {
  id: string;
  fullName: string;
  country: string;
  phoneNumber: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function AdminContactsPage() {
  const { getIdToken } = useAuth();
  const [contacts, setContacts] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to load messages");
      }
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading messages");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="mt-0.5 text-xs text-[#848e9c]">Contact form submissions from users</p>
        </div>
        <button
          onClick={() => void fetchContacts()}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#1e2329] px-3 py-2 text-xs text-[#848e9c] transition hover:text-white"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161a1e] py-16 text-center">
          <FiMessageSquare className="mb-3 text-4xl text-[#848e9c] opacity-50" />
          <p className="text-sm font-medium text-white">No messages yet</p>
          <p className="mt-1 text-xs text-[#848e9c]">Contact form submissions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4"
            >
              {/* Top row */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FiUser className="text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{c.fullName}</h3>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#848e9c]">
                      <span className="flex items-center gap-0.5">
                        <FiMapPin className="text-[9px]" />
                        {c.country}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <FiPhone className="text-[9px]" />
                        {c.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    c.status === "new"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-white/5 text-[#848e9c]"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              {/* Message */}
              <div className="mb-3 rounded-xl bg-[#0b0e11] p-3">
                <p className="text-xs leading-relaxed text-white/90 whitespace-pre-wrap">
                  {c.message}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-[#848e9c]">
                <div className="flex items-center gap-1">
                  <FiClock />
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
