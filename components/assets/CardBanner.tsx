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

export function CardBanner() {
  const { user } = useAuth();
  const [card, setCard] = useState<UserCard | null>(null);

  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    const unsub = onSnapshot(doc(db, "userCards", user.uid), (snap) => {
      setCard(snap.exists() ? (snap.data() as UserCard) : null);
    });
    return () => unsub();
  }, [user]);

  if (!card) return null;
  // If the user explicitly disabled it, don't show it.
  // We treat undefined as true (default is on).
  if (card.displayInAssets === false) return null;

  const maskedCard = "•••• " + card.cardNumber.split(" ")[3];

  // Map tierId to visual styles for the banner
  let bgGradient = "from-[#374151] via-[#1f2937] to-[#111827]";
  let textColor = "text-white";
  let visaColor = "#ffffff";
  
  if (card.tierId === "bronze") {
    bgGradient = "from-[#7c3a1c] via-[#92400e] to-[#78350f]";
    visaColor = "#fbbf24";
  } else if (card.tierId === "silver") {
    bgGradient = "from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8]";
    textColor = "text-slate-900";
    visaColor = "#0f172a";
  } else if (card.tierId === "gold") {
    bgGradient = "from-[#fcd34d] via-[#f59e0b] to-[#d97706]";
    textColor = "text-amber-950";
    visaColor = "#ffffff";
  } else if (card.tierId === "platinum") {
    bgGradient = "from-[#1e3a5f] via-[#1e40af] to-[#1d4ed8]";
  } else if (card.tierId === "diamond") {
    bgGradient = "from-[#171717] via-[#0a0a0a] to-[#000000]";
  } else if (card.tierId === "black") {
    bgGradient = "from-[#09090b] via-[#000000] to-[#000000]";
  }

  return (
    <Link href="/card" className="block relative w-full rounded-2xl overflow-hidden shadow-lg border border-white/[0.04] transition active:scale-[0.98]">
      <div className={`w-full bg-gradient-to-r ${bgGradient} px-5 py-4 flex items-center justify-between overflow-hidden relative`}>
        {/* Subtle background waves */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="absolute h-px bg-current w-[150%] -left-[25%] top-[10px]" style={{ transform: `rotate(${-10 + i * 5}deg) translateY(${i * 8}px)` }} />
          ))}
        </div>
        
        <div className="relative z-10 flex items-center gap-1.5">
          <p className={`font-bold text-base ${textColor}`}>My Card</p>
          <FiChevronRight size={16} className={`${textColor} opacity-60`} />
        </div>
        
        <div className="relative z-10 flex items-center gap-3">
          <p className={`font-mono text-sm tracking-widest ${textColor} opacity-80`}>
            {maskedCard}
          </p>
          <p className={`text-base font-black italic`} style={{ color: visaColor }}>
            VISA
          </p>
        </div>
      </div>
    </Link>
  );
}
