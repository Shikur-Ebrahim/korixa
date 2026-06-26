"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeFundingWallets } from "@/lib/profile/wallet-service";
import type { WalletAsset } from "@/lib/profile/wallet-service";
import { getClientFirestore } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import {
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiLock,
  FiUnlock,
  FiCheck,
  FiCreditCard,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// ── Card tiers ─────────────────────────────────────────────────────────────
const CARD_TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 7,
    initialBalance: 3,
    dailyLimit: 50,
    monthlyLimit: 300,
    gradient: "from-[#374151] via-[#1f2937] to-[#111827]",
    accentColor: "#9ca3af",
    glowColor: "rgba(156,163,175,0.28)",
    visaColor: "#9ca3af",
    perks: ["Virtual card", "Basic spending limits", "Card freeze"],
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 15,
    initialBalance: 8,
    dailyLimit: 150,
    monthlyLimit: 900,
    gradient: "from-[#7c3a1c] via-[#92400e] to-[#78350f]",
    accentColor: "#d97706",
    glowColor: "rgba(217,119,6,0.32)",
    visaColor: "#fbbf24",
    perks: ["Virtual card", "Higher limits", "Spending insights", "Card freeze"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 25,
    initialBalance: 15,
    dailyLimit: 300,
    monthlyLimit: 1800,
    gradient: "from-[#4b5563] via-[#6b7280] to-[#374151]",
    accentColor: "#e2e8f0",
    glowColor: "rgba(226,232,240,0.32)",
    visaColor: "#f1f5f9",
    perks: ["Virtual card", "2% cashback", "Priority support", "Freeze & lock"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 50,
    initialBalance: 30,
    dailyLimit: 500,
    monthlyLimit: 3000,
    gradient: "from-[#92400e] via-[#b45309] to-[#a16207]",
    accentColor: "#fbbf24",
    glowColor: "rgba(251,191,36,0.38)",
    visaColor: "#fde68a",
    perks: ["Virtual card", "5% cashback", "24/7 concierge", "Global access"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 100,
    initialBalance: 60,
    dailyLimit: 1000,
    monthlyLimit: 6000,
    gradient: "from-[#1e3a5f] via-[#1e40af] to-[#1d4ed8]",
    accentColor: "#93c5fd",
    glowColor: "rgba(147,197,253,0.35)",
    visaColor: "#bfdbfe",
    perks: ["Virtual card", "8% cashback", "Lounge access", "Zero fees"],
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 200,
    initialBalance: 120,
    dailyLimit: 3000,
    monthlyLimit: 18000,
    gradient: "from-[#312e81] via-[#4c1d95] to-[#5b21b6]",
    accentColor: "#c4b5fd",
    glowColor: "rgba(196,181,253,0.4)",
    visaColor: "#ddd6fe",
    perks: ["Virtual + Physical", "12% cashback", "Private banking", "Dedicated manager"],
  },
  {
    id: "black",
    name: "Elite Black",
    price: 500,
    initialBalance: 300,
    dailyLimit: 10000,
    monthlyLimit: 60000,
    gradient: "from-[#09090b] via-[#18181b] to-[#27272a]",
    accentColor: "#f4f4f5",
    glowColor: "rgba(244,244,245,0.22)",
    visaColor: "#ffffff",
    perks: ["Virtual + Metal card", "15% cashback", "Private jet access", "Global VIP"],
  },
];

interface UserCard {
  tierId: string;
  balance: number;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  holderName: string;
  frozen: boolean;
  displayInAssets?: boolean;
  createdAt: unknown;
}

function generateCardNumber() {
  return Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000)
  ).join(" ");
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiry() {
  const now = new Date();
  // 3 years ahead — standard Visa expiry
  const exp = new Date(now.getFullYear() + 3, now.getMonth());
  const mm = String(exp.getMonth() + 1).padStart(2, "0");
  const yy = String(exp.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// ── Tiny chip SVG ─────────────────────────────────────────────────────────
function Chip({ color }: { color: string }) {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
      <rect x="0.5" y="0.5" width="37" height="27" rx="3.5" stroke={color} strokeOpacity="0.5" fill={color} fillOpacity="0.12" />
      <line x1="13" y1="0" x2="13" y2="28" stroke={color} strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="25" y1="0" x2="25" y2="28" stroke={color} strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="0" y1="10" x2="38" y2="10" stroke={color} strokeOpacity="0.3" strokeWidth="0.8" />
      <line x1="0" y1="18" x2="38" y2="18" stroke={color} strokeOpacity="0.3" strokeWidth="0.8" />
      <rect x="13.5" y="10.5" width="11" height="7" rx="1" stroke={color} strokeOpacity="0.4" fill={color} fillOpacity="0.08" />
    </svg>
  );
}

// ── Premium Card Visual ───────────────────────────────────────────────────
function PremiumCard({
  tier,
  card,
  showDetails,
  onClick,
}: {
  tier: (typeof CARD_TIERS)[0];
  card: UserCard;
  showDetails: boolean;
  onClick: () => void;
}) {
  const parts = card.cardNumber.split(" ");
  const maskedParts = showDetails
    ? parts
    : ["••••", "••••", "••••", parts[3]];

  return (
    <button
      onClick={onClick}
      className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${tier.gradient} p-5 text-left overflow-hidden shadow-2xl transition-transform active:scale-[0.98]`}
      style={{ boxShadow: `0 20px 60px ${tier.glowColor}, 0 6px 20px rgba(0,0,0,0.6)` }}
    >
      {/* Background lines */}
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="absolute h-[1px] bg-white"
          style={{
            top: `${8 + i * 10}%`,
            left: "-5%",
            right: "-5%",
            transform: `rotate(${-18 + i * 3}deg)`,
            opacity: 0.06 + i * 0.005,
          }}
        />
      ))}

      {/* Glow orbs */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl opacity-25" style={{ background: tier.accentColor }} />
      <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full blur-3xl opacity-15" style={{ background: tier.accentColor }} />

      {/* Top row */}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">Korixa Pay</p>
          <p className="text-xs font-black uppercase tracking-wider mt-0.5" style={{ color: tier.accentColor }}>
            {tier.name}
          </p>
        </div>
        <Chip color={tier.accentColor} />
      </div>

      {/* Card number */}
      <div className="relative mt-5 flex items-center gap-3">
        {maskedParts.map((part, i) => (
          <p key={i} className="font-mono text-sm tracking-[0.15em] text-white/90">
            {part}
          </p>
        ))}
      </div>

      {/* Bottom */}
      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-[0.12em] text-white/35">Card Holder</p>
          <p className="text-xs font-bold text-white mt-0.5 max-w-[140px] truncate">
            {card.holderName.toUpperCase()}
          </p>
          <div className="flex gap-4 mt-2">
            <div>
              <p className="text-[7px] uppercase tracking-widest text-white/35">Valid Thru</p>
              <p className="text-[10px] font-mono font-bold text-white/90">
                {showDetails ? card.expiryDate : "••/••"}
              </p>
            </div>
            <div>
              <p className="text-[7px] uppercase tracking-widest text-white/35">CVV</p>
              <p className="text-[10px] font-mono font-bold text-white/90">
                {showDetails ? card.cvv : "•••"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <p className="text-xl font-black italic leading-none tracking-tight" style={{ color: tier.visaColor }}>
            VISA
          </p>
          <div className="flex items-center gap-0.5">
            <div className="h-5 w-5 rounded-full opacity-70" style={{ background: tier.accentColor }} />
            <div className="h-5 w-5 rounded-full -ml-2 opacity-50" style={{ background: tier.visaColor }} />
          </div>
        </div>
      </div>

      {/* Eye hint */}
      <div className="absolute bottom-3 right-3 opacity-30">
        {showDetails ? <FiEyeOff size={12} className="text-white" /> : <FiEye size={12} className="text-white" />}
      </div>
    </button>
  );
}

// ── Tier Browse Card (vertical list for non-owners) ───────────────────────
function BrowseTierCard({
  tier,
  onBuy,
}: {
  tier: (typeof CARD_TIERS)[0];
  onBuy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
      {/* Visual preview */}
      <div
        className={`relative aspect-[1.586/1] bg-gradient-to-br ${tier.gradient} p-5 overflow-hidden`}
        style={{ boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.3)` }}
      >
        {[...Array(7)].map((_, i) => (
          <div key={i} className="absolute h-[1px] bg-white" style={{ top: `${10 + i * 12}%`, left: "-5%", right: "-5%", transform: `rotate(${-15 + i * 3}deg)`, opacity: 0.07 }} />
        ))}
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full blur-2xl opacity-20" style={{ background: tier.accentColor }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">Korixa Pay</p>
            <p className="text-xs font-black uppercase tracking-wider mt-0.5" style={{ color: tier.accentColor }}>
              {tier.name}
            </p>
          </div>
          <Chip color={tier.accentColor} />
        </div>

        <div className="relative mt-4 flex gap-3">
          {["••••", "••••", "••••", "1234"].map((p, i) => (
            <p key={i} className="font-mono text-sm tracking-[0.15em] text-white/70">{p}</p>
          ))}
        </div>

        <div className="relative mt-4 flex items-end justify-between">
          <div>
            <p className="text-[8px] uppercase tracking-[0.12em] text-white/35">Card Holder</p>
            <p className="text-xs font-bold text-white/70 mt-0.5">YOUR NAME</p>
            <div className="flex gap-4 mt-1.5">
              <div>
                <p className="text-[7px] uppercase tracking-widest text-white/35">Valid Thru</p>
                <p className="text-[10px] font-mono text-white/60">••/••</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-xl font-black italic leading-none" style={{ color: tier.visaColor }}>VISA</p>
            <div className="flex">
              <div className="h-5 w-5 rounded-full opacity-60" style={{ background: tier.accentColor }} />
              <div className="h-5 w-5 rounded-full -ml-2 opacity-40" style={{ background: tier.visaColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Info + button */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-white">{tier.name} Card</p>
            <p className="text-[10px] text-[#848e9c] mt-0.5">
              ${tier.initialBalance} initial · ${tier.dailyLimit}/day · ${tier.monthlyLimit}/mo
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#848e9c]">Price</p>
            <p className="text-base font-black text-primary">${tier.price}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {tier.perks.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[9px] font-semibold text-[#848e9c]">
              <FiCheck size={8} className="text-primary" /> {p}
            </span>
          ))}
        </div>

        <button
          onClick={onBuy}
          className="w-full rounded-xl py-3 text-xs font-bold text-black shadow-lg transition active:scale-[0.98]"
          style={{ background: tier.accentColor, boxShadow: `0 8px 24px ${tier.glowColor}` }}
        >
          Get {tier.name} Card — ${tier.price} USDT
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [card, setCard] = useState<UserCard | null>(null);
  const [wallets, setWallets] = useState<WalletAsset[]>([]);
  const [loadingCard, setLoadingCard] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [confirmTier, setConfirmTier] = useState<(typeof CARD_TIERS)[0] | null>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [buying, setBuying] = useState(false);
  const [topping, setTopping] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [kycName, setKycName] = useState("KORIXA USER");
  const [kycStatus, setKycStatus] = useState("pending");
  const [showKycRequiredModal, setShowKycRequiredModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data?.fullName) setKycName(data.fullName.toUpperCase());
        if (data?.kycStatus) setKycStatus(data.kycStatus);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    const unsub = onSnapshot(doc(db, "userCards", user.uid), (snap) => {
      setCard(snap.exists() ? (snap.data() as UserCard) : null);
      setLoadingCard(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return subscribeFundingWallets(user.uid, setWallets);
  }, [user]);

  const usdtBalance = wallets.find((w) => w.coin === "USDT")?.availableBalance ?? 0;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuyCard = async () => {
    if (!user || !confirmTier) return;
    if (usdtBalance < confirmTier.price) {
      showToast(`Need $${confirmTier.price} USDT. You have $${usdtBalance.toFixed(2)}.`, false);
      return;
    }
    const usdtWallet = wallets.find((w) => w.coin === "USDT");
    if (!usdtWallet) {
      showToast("USDT Wallet not found.", false);
      return;
    }

    setBuying(true);
    try {
      const db = getClientFirestore();
      await updateDoc(doc(db, "wallets", usdtWallet.id), {
        availableBalance: increment(-confirmTier.price),
        balance: increment(-confirmTier.price),
      });
      await setDoc(doc(db, "userCards", user.uid), {
        tierId: confirmTier.id,
        balance: (card?.balance || 0) + confirmTier.initialBalance,
        cardNumber: generateCardNumber(),
        expiryDate: generateExpiry(),
        cvv: generateCVV(),
        holderName: kycName,
        frozen: false,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, `users/${user.uid}/transactions/${Date.now()}`), {
        type: "card_purchase",
        amount: confirmTier.price,
        coin: "USDT",
        usdValue: confirmTier.price,
        status: "completed",
        timestamp: Date.now(),
        userId: user.uid,
      });
      setConfirmTier(null);
      showToast("Card activated! 🎉");
    } catch (e) {
      console.error(e);
      showToast("Purchase failed. Try again.", false);
    } finally {
      setBuying(false);
    }
  };

  const handleTopup = async () => {
    if (!user || !card) return;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0 || amount > usdtBalance) return;
    const usdtWallet = wallets.find((w) => w.coin === "USDT");
    if (!usdtWallet) return;

    setTopping(true);
    try {
      const db = getClientFirestore();
      await updateDoc(doc(db, "wallets", usdtWallet.id), {
        availableBalance: increment(-amount),
        balance: increment(-amount),
      });
      await updateDoc(doc(db, "userCards", user.uid), { balance: increment(amount) });
      setTopupAmount("");
      setShowTopupModal(false);
      showToast(`$${amount} added to card ✅`);
    } catch {
      showToast("Top-up failed.", false);
    } finally {
      setTopping(false);
    }
  };

  const handleFreeze = async () => {
    if (!user || !card) return;
    setFreezing(true);
    try {
      await updateDoc(doc(getClientFirestore(), "userCards", user.uid), { frozen: !card.frozen });
      showToast(card.frozen ? "Card unfrozen ✅" : "Card frozen 🔒");
    } catch {
      showToast("Failed.", false);
    } finally {
      setFreezing(false);
    }
  };

  const currentTier = card ? CARD_TIERS.find((t) => t.id === card.tierId) ?? CARD_TIERS[0] : null;

  return (
    <div className="min-h-screen bg-[#0b0e11] pb-24 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-2xl border ${toast.ok ? "bg-green-900/90 border-green-500/30 text-green-300" : "bg-red-900/90 border-red-500/30 text-red-300"}`}>
          {toast.ok ? <FiCheck size={14} /> : <FiX size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white">
            <FiArrowLeft size={16} />
          </button>
          <h1 className="text-base font-bold">My Card</h1>
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-[#161a1e] border border-white/[0.06] px-3 py-1.5">
            <FiCreditCard size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-[#848e9c]">USDT</span>
            <span className="text-xs font-bold text-white">${usdtBalance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-4">
        {loadingCard ? (
          <div className="space-y-4">
            <div className="aspect-[1.586/1] rounded-2xl bg-white/[0.03]" />
            <div className="h-24 rounded-xl bg-white/[0.03]" />
          </div>
        ) : card && currentTier ? (
          <>
            {/* Active card */}
            <PremiumCard
              tier={currentTier}
              card={card}
              showDetails={showDetails}
              onClick={() => setShowDetails((v) => !v)}
            />

            {/* Tap hint */}
            <p className="text-center text-[10px] text-[#848e9c]">
              {showDetails ? "Tap card to hide details" : "Tap card to reveal details"}
            </p>

            {/* Status + balance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-[#848e9c]">Status</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5"
                  style={{ borderColor: card.frozen ? "#ef4444" : "#22c55e", background: card.frozen ? "#ef444415" : "#22c55e15" }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: card.frozen ? "#ef4444" : "#22c55e" }} />
                  <span className="text-[9px] font-bold" style={{ color: card.frozen ? "#ef4444" : "#22c55e" }}>
                    {card.frozen ? "Frozen" : "Active"}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-[#848e9c]">Card Balance</p>
                <p className="mt-1 text-lg font-black text-white">${card.balance.toFixed(2)}</p>
              </div>
            </div>

            {/* Limits */}
            <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3">
              <div className="flex justify-between text-[10px] mb-2">
                <span className="text-[#848e9c]">Daily Limit</span>
                <span className="font-bold text-white">${currentTier.dailyLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#848e9c]">Monthly Limit</span>
                <span className="font-bold text-white">${currentTier.monthlyLimit.toLocaleString()}</span>
              </div>
            </div>

            {/* Card detail rows (shown when tapped) */}
            {showDetails && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] divide-y divide-white/[0.04] overflow-hidden">
                {[
                  { label: "Card Number", value: card.cardNumber },
                  { label: "Card Holder", value: card.holderName },
                  { label: "Valid Thru", value: card.expiryDate },
                  { label: "CVV", value: card.cvv },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <p className="text-[10px] text-[#848e9c]">{label}</p>
                    <p className="text-xs font-bold text-white font-mono">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
              >
                <FiPlus size={14} /> Top Up
              </button>
              <button
                onClick={handleFreeze}
                disabled={freezing}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#161a1e] py-3 text-xs font-bold text-white hover:bg-white/[0.04] transition disabled:opacity-50"
              >
                {card.frozen ? <FiUnlock size={14} className="text-blue-400" /> : <FiLock size={14} className="text-blue-400" />}
                {card.frozen ? "Unfreeze" : "Freeze"}
              </button>
            </div>

            {/* Perks */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#848e9c] mb-3">
                {currentTier.name} Benefits
              </p>
              <div className="space-y-2">
                {currentTier.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <FiCheck size={11} className="text-primary shrink-0" />
                    <p className="text-xs text-[#848e9c]">{perk}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Display in Assets Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161a1e] p-4 mt-2">
              <div>
                <p className="text-xs font-bold text-white">Show in Assets</p>
                <p className="text-[10px] text-[#848e9c]">Display card on Wallet page</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await updateDoc(doc(getClientFirestore(), "userCards", user.uid), {
                      displayInAssets: card.displayInAssets === false ? true : false,
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className={`relative h-6 w-10 rounded-full transition-colors ${card.displayInAssets !== false ? "bg-primary" : "bg-white/[0.1]"}`}
              >
                <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${card.displayInAssets !== false ? "left-5" : "left-1"}`} />
              </button>
            </div>

            {/* Upgrade Card Button */}
            {!showUpgrade && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] py-3 text-xs font-bold text-white hover:bg-white/[0.04] transition mt-2"
              >
                Upgrade or Change Card Tier
              </button>
            )}

            {showUpgrade && (
              <div className="mt-6 border-t border-white/[0.06] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">Upgrade Card</h2>
                    <p className="text-[10px] text-[#848e9c]">Your current balance will carry over.</p>
                  </div>
                  <button onClick={() => setShowUpgrade(false)} className="text-xs font-bold text-[#848e9c] hover:text-white">
                    Cancel
                  </button>
                </div>
                <div className="space-y-5">
                  {CARD_TIERS.filter((t) => t.id !== currentTier.id).map((tier) => (
                    <BrowseTierCard
                      key={tier.id}
                      tier={tier}
                      onBuy={() => setConfirmTier(tier)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* No card — vertical tier browser */}
            <div className="text-center pt-2 pb-2">
              <h2 className="text-base font-bold text-white">Choose Your Card</h2>
              <p className="text-[10px] text-[#848e9c] mt-1">
                7 tiers available · Spend crypto worldwide · Instant activation
              </p>
            </div>

            <div className="space-y-5">
              {CARD_TIERS.map((tier) => (
                <BrowseTierCard
                  key={tier.id}
                  tier={tier}
                  onBuy={() => {
                    if (kycStatus !== "verified") {
                      setShowKycRequiredModal(true);
                    } else {
                      setConfirmTier(tier);
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── KYC Required Modal ─────────────────────────────────────────── */}
      {showKycRequiredModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-4 sm:p-0">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowKycRequiredModal(false)} />
          <div className="relative w-full max-w-sm mx-auto bg-[#161a1e] rounded-3xl border border-white/[0.06] shadow-2xl p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mb-4">
              <FiLock size={24} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Identity Verification Required</h3>
            <p className="text-[11px] text-[#848e9c] mb-6 leading-relaxed">
              To comply with financial regulations and protect your account, you must complete KYC verification before applying for a Korixa Card.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowKycRequiredModal(false)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#0b0e11] py-3.5 text-xs font-bold text-white hover:bg-white/[0.04] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => router.push("/kyc")}
                className="w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Buy Modal ──────────────────────────────────────────── */}
      {confirmTier && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmTier(null)} />
          <div className="relative w-full max-w-lg mx-auto bg-[#161a1e] rounded-t-3xl sm:rounded-3xl border border-white/[0.06] shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Confirm Purchase</h3>
              <button onClick={() => setConfirmTier(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[#848e9c]">
                <FiX size={16} />
              </button>
            </div>

            {/* Mini card preview */}
            <div
              className={`relative aspect-[1.586/1] rounded-xl bg-gradient-to-br ${confirmTier.gradient} p-4 mb-4 overflow-hidden`}
              style={{ boxShadow: `0 12px 40px ${confirmTier.glowColor}` }}
            >
              {[...Array(5)].map((_, i) => (
                <div key={i} className="absolute h-[1px] bg-white" style={{ top: `${15 + i * 16}%`, left: "-5%", right: "-5%", transform: `rotate(-12deg)`, opacity: 0.06 }} />
              ))}
              <p className="relative text-[8px] font-bold uppercase tracking-widest text-white/40">Korixa Pay</p>
              <p className="relative text-xs font-black uppercase tracking-wider mt-0.5" style={{ color: confirmTier.accentColor }}>
                {confirmTier.name}
              </p>
              <div className="relative mt-3 flex gap-3">
                {["••••", "••••", "••••", "----"].map((p, i) => (
                  <p key={i} className="font-mono text-xs tracking-widest text-white/60">{p}</p>
                ))}
              </div>
              <div className="relative mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[7px] text-white/35 uppercase tracking-widest">Card Holder</p>
                  <p className="text-xs font-bold text-white/70">{kycName}</p>
                </div>
                <p className="text-base font-black italic" style={{ color: confirmTier.visaColor }}>VISA</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 space-y-2 mb-4">
              {[
                { label: "Card tier", value: confirmTier.name },
                { label: "Card price", value: `$${confirmTier.price} USDT`, highlight: true },
                { label: "Added balance", value: `+$${confirmTier.initialBalance}`, green: true },
                card ? { label: "Previous balance", value: `$${card.balance.toFixed(2)}` } : null,
                card ? { label: "New total balance", value: `$${((card.balance || 0) + confirmTier.initialBalance).toFixed(2)}`, highlight: true } : null,
                { label: "Daily / Monthly limit", value: `$${confirmTier.dailyLimit} / $${confirmTier.monthlyLimit}` },
                { label: "Your USDT balance", value: `$${usdtBalance.toFixed(2)}`, warn: usdtBalance < confirmTier.price },
              ].filter(Boolean).map((item) => {
                const { label, value, highlight, green, warn } = item as any;
                return (
                  <div key={label} className="flex justify-between text-[10px]">
                    <span className="text-[#848e9c]">{label}</span>
                    <span className={`font-bold ${highlight ? "text-primary" : green ? "text-green-400" : warn ? "text-red-400" : "text-white"}`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleBuyCard}
              disabled={buying || usdtBalance < confirmTier.price}
              className="w-full rounded-xl py-3.5 text-xs font-bold text-black shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: confirmTier.accentColor, boxShadow: `0 8px 24px ${confirmTier.glowColor}` }}
            >
              {buying
                ? "Activating..."
                : usdtBalance < confirmTier.price
                ? `Need $${(confirmTier.price - usdtBalance).toFixed(2)} more USDT`
                : `Activate ${confirmTier.name} Card — $${confirmTier.price}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Top-up Modal ──────────────────────────────────────────────── */}
      {showTopupModal && card && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTopupModal(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-[#161a1e] rounded-t-3xl sm:rounded-3xl border border-white/[0.06] shadow-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Top Up Card</h3>
              <button onClick={() => setShowTopupModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[#848e9c]">
                <FiX size={16} />
              </button>
            </div>

            <div className="rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 mb-4 space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#848e9c]">Funding balance (USDT)</span>
                <span className="font-bold text-white">${usdtBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#848e9c]">Current card balance</span>
                <span className="font-bold text-white">${card.balance.toFixed(2)}</span>
              </div>
            </div>

            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#848e9c] mb-2">
              Amount (USDT)
            </label>
            <input
              type="number"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.08] px-4 py-3 text-center text-2xl font-black text-white focus:outline-none focus:border-primary transition mb-4"
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 20, 50].map((amt) => (
                <button key={amt} onClick={() => setTopupAmount(String(amt))}
                  className="rounded-xl bg-[#0b0e11] border border-white/[0.06] py-2 text-[10px] font-bold text-[#848e9c] hover:border-primary hover:text-primary transition">
                  ${amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopup}
              disabled={topping || !topupAmount || parseFloat(topupAmount) <= 0 || parseFloat(topupAmount) > usdtBalance}
              className="w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50"
            >
              {topping ? "Processing..." : `Top Up $${topupAmount || "0"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
