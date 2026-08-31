"use client";

import { useCallback, useEffect, useState } from "react";
import { FiMessageSquare, FiClock, FiCheck } from "react-icons/fi";
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
      if (!res.ok) throw new Error("Failed to load contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading contacts");
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { void fetchContacts(); }, [fetchContacts]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Contacts</h1>
        <p className="mt-0.5 text-xs text-[#848e9c]">Manage contact form submissions</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-8 text-center text-[#848e9c]">
          <FiMessageSquare className="mx-auto mb-3 text-3xl opacity-50" />
          <p className="text-sm font-medium">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{c.fullName}</h3>
                  <p className="text-[10px] text-[#848e9c]">
                    {c.country} • {c.phoneNumber}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    c.status === "new"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-white/5 text-[#848e9c]"
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="mb-3 rounded-xl bg-[#0b0e11] p-3">
                <p className="text-xs text-white/90 whitespace-pre-wrap">{c.message}</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#848e9c]">
                <div className="flex items-center gap-1">
                  <FiClock />
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                {c.status === "new" && (
                  <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                    <FiCheck />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
