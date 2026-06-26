"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiChevronRight } from "react-icons/fi";
import { useAuth } from "@/components/auth/AuthProvider";
import { getClientFirestore } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface UserCard {
  tierId: string;
  balance: number;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
  frozen: boolean;
  displayInAssets?: boolean;
}

const TIER_STYLES: Record<string, { bg: string; text: string; visa: string; label: string }> = {
  starter:  { bg: "linear-gradient(135deg, #374151 0%, #1f2937 60%, #111827 100%)", text: "#ffffff", visa: "#ffffff", label: "Starter" },
  bronze:   { bg: "linear-gradient(135deg, #92400e 0%, #78350f 60%, #451a03 100%)", text: "#fef3c7", visa: "#fbbf24", label: "Bronze" },
  silver:   { bg: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 60%, #94a3b8 100%)", text: "#0f172a", visa: "#0f172a", label: "Silver" },
  gold:     { bg: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 60%, #d97706 100%)", text: "#451a03", visa: "#ffffff", label: "Gold" },
  platinum: { bg: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 60%, #1d4ed8 100%)", text: "#ffffff", visa: "#93c5fd", label: "Platinum" },
  diamond:  { bg: "linear-gradient(135deg, #4c1d95 0%, #1e1b4b 60%, #000000 100%)", text: "#e9d5ff", visa: "#c4b5fd", label: "Diamond" },
  black:    { bg: "linear-gradient(135deg, #18181b 0%, #09090b 60%, #000000 100%)", text: "#d4d4d8", visa: "#fafafa", label: "Black" },
};

export function CardBanner() {
  const { user } = useAuth();
  const [card, setCard] = useState<UserCard | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    const unsub = onSnapshot(doc(db, "userCards", user.uid), (snap) => {
      setCard(snap.exists() ? (snap.data() as UserCard) : null);
    });
    return () => unsub();
  }, [user]);

  // Loading or no card
  if (card === undefined || card === null) return null;
  // User explicitly hid it
  if (card.displayInAssets === false) return null;

  const style = TIER_STYLES[card.tierId] ?? TIER_STYLES.starter;
  const lastFour = card.cardNumber?.split(" ").pop() ?? "----";

  return (
    <Link
      href="/card"
      style={{ display: "block", borderRadius: "16px", overflow: "hidden", textDecoration: "none" }}
    >
      <div
        style={{
          background: style.bg,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 100, height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.07)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 40, bottom: -40,
          width: 120, height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }} />

        {/* Left: label + chip icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: style.text, fontSize: 10, opacity: 0.65, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              My Card
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <span style={{ color: style.text, fontSize: 15, fontWeight: 800 }}>
                {style.label}
              </span>
              <FiChevronRight size={14} color={style.text} style={{ opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Right: masked number + VISA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          <span style={{
            color: style.text,
            fontFamily: "monospace",
            fontSize: 13,
            letterSpacing: 3,
            opacity: 0.85,
          }}>
            •••• {lastFour}
          </span>
          <span style={{
            color: style.visa,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 17,
            letterSpacing: 0,
            lineHeight: 1,
          }}>
            VISA
          </span>
        </div>
      </div>
    </Link>
  );
}
