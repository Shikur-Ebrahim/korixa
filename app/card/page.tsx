"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeFundingWallets } from "@/lib/profile/wallet-service";
import type { WalletAsset } from "@/lib/profile/wallet-service";
import {
  getClientFirestore,
} from "@/lib/firebase";
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
  FiStar,
  FiCheck,
  FiCreditCard,
  FiZap,
  FiShield,
  FiX,
} from "react-icons/fi";

// ── Card tiers ────────────────────────────────────────────────────────────────
const CARD_TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 7,
    initialBalance: 3,
    dailyLimit: 50,
    monthlyLimit: 200,
    gradient: "from-[#374151] via-[#1f2937] to-[#111827]",
    badge: "bg-gray-500/20 text-gray-300",
    accentColor: "#9ca3af",
    glowColor: "rgba(156,163,175,0.3)",
    visa: "text-gray-300",
    networkLine: "opacity-10",
    perks: ["Virtual card", "Basic limits", "Card freeze"],
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 15,
    initialBalance: 8,
    dailyLimit: 150,
    monthlyLimit: 600,
    gradient: "from-[#7c3a1c] via-[#92400e] to-[#78350f]",
    badge: "bg-amber-900/40 text-amber-400",
    accentColor: "#d97706",
    glowColor: "rgba(217,119,6,0.35)",
    visa: "text-amber-400",
    networkLine: "opacity-15",
    perks: ["Virtual card", "Higher limits", "Card freeze", "Spending insights"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 25,
    initialBalance: 15,
    dailyLimit: 300,
    monthlyLimit: 1200,
    gradient: "from-[#374151] via-[#4b5563] to-[#6b7280]",
    badge: "bg-slate-500/30 text-slate-200",
    accentColor: "#cbd5e1",
    glowColor: "rgba(203,213,225,0.35)",
    visa: "text-slate-200",
    networkLine: "opacity-20",
    perks: ["Virtual card", "Priority support", "2% cashback", "Freeze & lock"],
  },
  {
    id: "gold",
    name: "Gold",
    price: 50,
    initialBalance: 30,
    dailyLimit: 500,
    monthlyLimit: 2000,
    gradient: "from-[#854d0e] via-[#ca8a04] to-[#a16207]",
    badge: "bg-yellow-500/20 text-yellow-400",
    accentColor: "#fbbf24",
    glowColor: "rgba(251,191,36,0.4)",
    visa: "text-yellow-400",
    networkLine: "opacity-25",
    perks: ["Virtual card", "5% cashback", "24/7 concierge", "Global access", "Priority KYC"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 100,
    initialBalance: 60,
    dailyLimit: 1000,
    monthlyLimit: 5000,
    gradient: "from-[#1e3a5f] via-[#1e40af] to-[#1d4ed8]",
    badge: "bg-blue-500/20 text-blue-300",
    accentColor: "#60a5fa",
    glowColor: "rgba(96,165,250,0.4)",
    visa: "text-blue-300",
    networkLine: "opacity-30",
    perks: ["Virtual card", "8% cashback", "Lounge access", "Travel insurance", "Zero fees"],
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 200,
    initialBalance: 120,
    dailyLimit: 3000,
    monthlyLimit: 15000,
    gradient: "from-[#312e81] via-[#4c1d95] to-[#5b21b6]",
    badge: "bg-purple-500/20 text-purple-300",
    accentColor: "#a78bfa",
    glowColor: "rgba(167,139,250,0.45)",
    visa: "text-purple-300",
    networkLine: "opacity-35",
    perks: ["Virtual + Physical", "12% cashback", "Private banking", "Dedicated manager", "Airport VIP"],
  },
  {
    id: "black",
    name: "Elite Black",
    price: 500,
    initialBalance: 300,
    dailyLimit: 10000,
    monthlyLimit: 50000,
    gradient: "from-[#0a0a0a] via-[#171717] to-[#18181b]",
    badge: "bg-white/10 text-white",
    accentColor: "#f5f5f5",
    glowColor: "rgba(255,255,255,0.25)",
    visa: "text-white",
    networkLine: "opacity-40",
    perks: ["Virtual + Metal card", "15% cashback", "Private jet access", "Wealth manager", "Global VIP"],
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
  createdAt: unknown;
}

function generateCardNumber(): string {
  const parts = Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000).toString()
  );
  return parts.join(" ");
}

function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiry(): string {
  const now = new Date();
  const expYear = (now.getFullYear() + 4) % 100;
  const expMonth = String(now.getMonth() + 1).padStart(2, "0");
  return `${expMonth}/${expYear}`;
}

// ── Card Visual Component ─────────────────────────────────────────────────────
function CardVisual({
  tier,
  card,
  showDetails,
}: {
  tier: (typeof CARD_TIERS)[0];
  card: UserCard;
  showDetails: boolean;
}) {
  const maskedNumber = showDetails
    ? card.cardNumber
    : card.cardNumber.replace(/(\d{4} ){3}/, "**** **** **** ");

  return (
    <div
      className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${tier.gradient} p-5 shadow-2xl overflow-hidden select-none`}
      style={{ boxShadow: `0 20px 60px ${tier.glowColor}, 0 4px 20px rgba(0,0,0,0.5)` }}
    >
      {/* Network pattern lines */}
      <div className={`absolute inset-0 ${tier.networkLine}`}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-white"
            style={{
              top: `${10 + i * 12}%`,
              left: "-10%",
              right: "-10%",
              transform: `rotate(${-15 + i * 3}deg)`,
              opacity: 0.4 - i * 0.04,
            }}
          />
        ))}
      </div>

      {/* Glowing orbs */}
      <div
        className="absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl opacity-30"
        style={{ background: tier.accentColor }}
      />
      <div
        className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full blur-2xl opacity-20"
        style={{ background: tier.accentColor }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            Korixa
          </p>
          <p
            className="text-xs font-bold uppercase tracking-wider mt-0.5"
            style={{ color: tier.accentColor }}
          >
            {tier.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Chip */}
          <div
            className="h-6 w-9 rounded-sm border opacity-80"
            style={{ borderColor: tier.accentColor, background: `${tier.accentColor}20` }}
          >
            <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-px p-0.5 opacity-60">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-[1px]" style={{ background: tier.accentColor }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Card number */}
      <p className="relative mt-6 font-mono text-sm tracking-widest text-white/90">
        {maskedNumber}
      </p>

      {/* Bottom row */}
      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-widest text-white/40">Card Holder</p>
          <p className="text-xs font-bold text-white mt-0.5 truncate max-w-[140px]">
            {card.holderName.toUpperCase()}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/40">Expires</p>
              <p className="text-[10px] font-mono text-white/80">
                {showDetails ? card.expiryDate : "••/••"}
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-widest text-white/40">CVV</p>
              <p className="text-[10px] font-mono text-white/80">
                {showDetails ? card.cvv : "•••"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p
            className={`text-lg font-black italic tracking-tight ${tier.visa}`}
          >
            VISA
          </p>
          <p className="text-[7px] text-white/30 uppercase tracking-widest">Virtual</p>
        </div>
      </div>
    </div>
  );
}

// ── Tier Selector Card (in buy modal) ────────────────────────────────────────
function TierCard({
  tier,
  selected,
  onClick,
}: {
  tier: (typeof CARD_TIERS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-white/[0.06] bg-[#0b0e11] hover:border-white/[0.12]"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <FiCheck className="text-black" size={10} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tier.gradient}`}
          style={{ boxShadow: `0 4px 12px ${tier.glowColor}` }}
        >
          <p className="text-[10px] font-black text-white/90">{tier.name.toUpperCase()}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-white">{tier.name} Card</p>
            <p className="text-xs font-bold text-primary">${tier.price}</p>
          </div>
          <p className="text-[10px] text-[#848e9c] mt-0.5">
            ${tier.initialBalance} initial balance · ${tier.dailyLimit}/day limit
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tier.perks.slice(0, 3).map((p) => (
              <span key={p} className="rounded px-1.5 py-0.5 text-[9px] bg-white/[0.05] text-[#848e9c]">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [card, setCard] = useState<UserCard | null>(null);
  const [wallets, setWallets] = useState<WalletAsset[]>([]);
  const [loadingCard, setLoadingCard] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(CARD_TIERS[0]);
  const [topupAmount, setTopupAmount] = useState("");
  const [buying, setBuying] = useState(false);
  const [topping, setTopping] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [kycName, setKycName] = useState("KORIXA USER");

  // Load KYC name from firestore user doc
  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const name = snap.data()?.fullName;
        if (name) setKycName(name.toUpperCase());
      }
    });
  }, [user]);

  // Subscribe to card doc
  useEffect(() => {
    if (!user) return;
    const db = getClientFirestore();
    const unsub = onSnapshot(doc(db, "userCards", user.uid), (snap) => {
      if (snap.exists()) {
        setCard(snap.data() as UserCard);
      } else {
        setCard(null);
      }
      setLoadingCard(false);
    });
    return () => unsub();
  }, [user]);

  // Subscribe to funding wallets for USDT balance
  useEffect(() => {
    if (!user) return;
    return subscribeFundingWallets(user.uid, setWallets);
  }, [user]);

  const usdtBalance =
    wallets.find((w) => w.coin === "USDT")?.availableBalance ?? 0;

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuyCard = async () => {
    if (!user) return;
    if (usdtBalance < selectedTier.price) {
      showToast(`Insufficient balance. Need $${selectedTier.price} USDT.`, "err");
      return;
    }
    setBuying(true);
    try {
      const db = getClientFirestore();
      // Deduct from funding wallet
      const walletRef = doc(db, `users/${user.uid}/fundingWallets/USDT`);
      await updateDoc(walletRef, {
        availableBalance: increment(-selectedTier.price),
        balance: increment(-selectedTier.price),
      });
      // Create card doc
      await setDoc(doc(db, "userCards", user.uid), {
        tierId: selectedTier.id,
        balance: selectedTier.initialBalance,
        cardNumber: generateCardNumber(),
        expiryDate: generateExpiry(),
        cvv: generateCVV(),
        holderName: kycName,
        frozen: false,
        createdAt: serverTimestamp(),
      });
      // Record transaction
      await setDoc(doc(db, `users/${user.uid}/transactions/${Date.now()}`), {
        type: "card_purchase",
        amount: selectedTier.price,
        coin: "USDT",
        usdValue: selectedTier.price,
        status: "completed",
        timestamp: Date.now(),
        userId: user.uid,
      });
      setShowBuyModal(false);
      showToast("Card activated successfully! 🎉", "ok");
    } catch (e) {
      console.error(e);
      showToast("Failed to purchase card. Try again.", "err");
    } finally {
      setBuying(false);
    }
  };

  const handleTopup = async () => {
    if (!user || !card) return;
    const amount = parseFloat(topupAmount);
    if (!amount || amount <= 0) return;
    if (usdtBalance < amount) {
      showToast("Insufficient USDT balance.", "err");
      return;
    }
    setTopping(true);
    try {
      const db = getClientFirestore();
      const walletRef = doc(db, `users/${user.uid}/fundingWallets/USDT`);
      await updateDoc(walletRef, {
        availableBalance: increment(-amount),
        balance: increment(-amount),
      });
      await updateDoc(doc(db, "userCards", user.uid), {
        balance: increment(amount),
      });
      setTopupAmount("");
      setShowTopupModal(false);
      showToast(`$${amount} topped up to card ✅`, "ok");
    } catch (e) {
      showToast("Top-up failed. Try again.", "err");
    } finally {
      setTopping(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!user || !card) return;
    setFreezing(true);
    try {
      const db = getClientFirestore();
      await updateDoc(doc(db, "userCards", user.uid), {
        frozen: !card.frozen,
      });
      showToast(card.frozen ? "Card unfrozen ✅" : "Card frozen 🔒", "ok");
    } catch {
      showToast("Failed. Try again.", "err");
    } finally {
      setFreezing(false);
    }
  };

  const currentTier = card
    ? CARD_TIERS.find((t) => t.id === card.tierId) ?? CARD_TIERS[0]
    : null;

  return (
    <div className="min-h-screen bg-[#0b0e11] pb-24 text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold shadow-2xl border ${
            toast.type === "ok"
              ? "bg-green-900/90 border-green-500/30 text-green-300"
              : "bg-red-900/90 border-red-500/30 text-red-300"
          }`}
        >
          {toast.type === "ok" ? <FiCheck size={14} /> : <FiX size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0b0e11]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e2329] text-white"
          >
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

      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-5">
        {loadingCard ? (
          <div className="space-y-4">
            <div className="aspect-[1.586/1] w-full rounded-2xl bg-white/[0.03]" />
            <div className="h-28 rounded-xl bg-white/[0.03]" />
          </div>
        ) : card && currentTier ? (
          <>
            {/* Card Visual */}
            <div className={`relative ${card.frozen ? "opacity-60 saturate-0" : ""} transition-all`}>
              <CardVisual tier={currentTier} card={card} showDetails={showDetails} />
              {card.frozen && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <FiLock size={28} className="text-white" />
                    <p className="text-xs font-bold text-white">Card Frozen</p>
                  </div>
                </div>
              )}
            </div>

            {/* Card name + status */}
            <div className="text-center">
              <p className="text-sm font-bold text-white">{currentTier.name} Visa Virtual</p>
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-green-400">
                  {card.frozen ? "Frozen" : "Active"}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[#848e9c]">Card Balance</p>
              <p className="mt-1 text-3xl font-black text-white">
                ${card.balance.toFixed(2)}
              </p>
              <p className="text-[10px] text-[#848e9c] mt-0.5">
                ${currentTier.dailyLimit}/day · ${currentTier.monthlyLimit}/month limit
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-[#161a1e] border border-white/[0.06] py-3 px-2 transition hover:bg-white/[0.04]"
              >
                {showDetails ? <FiEyeOff size={18} className="text-primary" /> : <FiEye size={18} className="text-primary" />}
                <span className="text-[9px] font-bold text-[#848e9c]">
                  {showDetails ? "Hide" : "Show"} Details
                </span>
              </button>
              <button
                onClick={handleFreezeToggle}
                disabled={freezing}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-[#161a1e] border border-white/[0.06] py-3 px-2 transition hover:bg-white/[0.04] disabled:opacity-50"
              >
                {card.frozen
                  ? <FiUnlock size={18} className="text-blue-400" />
                  : <FiLock size={18} className="text-blue-400" />}
                <span className="text-[9px] font-bold text-[#848e9c]">
                  {card.frozen ? "Unfreeze" : "Freeze"}
                </span>
              </button>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-[#161a1e] border border-white/[0.06] py-3 px-2 transition hover:bg-white/[0.04]"
              >
                <FiPlus size={18} className="text-green-400" />
                <span className="text-[9px] font-bold text-[#848e9c]">Top Up</span>
              </button>
            </div>

            {/* Card details section */}
            {showDetails && (
              <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] divide-y divide-white/[0.04] overflow-hidden">
                {[
                  { label: "Card Number", value: card.cardNumber },
                  { label: "Card Holder", value: card.holderName },
                  { label: "Expiry Date", value: card.expiryDate },
                  { label: "CVV", value: card.cvv },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <p className="text-[10px] text-[#848e9c]">{label}</p>
                    <p className="text-xs font-bold text-white font-mono">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Perks */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-4">
              <p className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                <FiStar size={12} className="text-primary" /> {currentTier.name} Card Benefits
              </p>
              <div className="space-y-2">
                {currentTier.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2">
                    <FiCheck size={12} className="text-primary shrink-0" />
                    <p className="text-[10px] text-[#848e9c]">{perk}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* No card — show tiers to buy */}
            <div className="text-center pt-2 pb-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                <FiCreditCard size={28} className="text-primary" />
              </div>
              <h2 className="text-base font-bold text-white">Get Your Korixa Card</h2>
              <p className="text-[10px] text-[#848e9c] mt-1">
                Choose a card tier and start spending crypto worldwide
              </p>
            </div>

            {/* Tier preview carousel */}
            <div className="relative overflow-hidden">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {CARD_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => { setSelectedTier(tier); setShowBuyModal(true); }}
                    className="shrink-0 cursor-pointer"
                    style={{ width: "62vw", maxWidth: "240px" }}
                  >
                    <div
                      className={`relative aspect-[1.586/1] rounded-xl bg-gradient-to-br ${tier.gradient} p-4 overflow-hidden`}
                      style={{ boxShadow: `0 12px 40px ${tier.glowColor}` }}
                    >
                      <div className={`absolute inset-0 ${tier.networkLine}`}>
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="absolute h-px bg-white" style={{ top: `${15 + i * 16}%`, left: "-10%", right: "-10%", transform: `rotate(${-12 + i * 3}deg)`, opacity: 0.3 }} />
                        ))}
                      </div>
                      <p className="relative text-[9px] font-bold uppercase tracking-widest text-white/50">Korixa</p>
                      <p className="relative text-xs font-black mt-1 uppercase tracking-wider" style={{ color: tier.accentColor }}>{tier.name}</p>
                      <div className="relative mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-[7px] text-white/40 uppercase tracking-widest">From</p>
                          <p className="text-lg font-black text-white">${tier.price}</p>
                        </div>
                        <p className={`text-base font-black italic ${tier.visa}`}>VISA</p>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[10px] font-bold text-[#848e9c]">
                      ${tier.initialBalance} initial · Tap to select
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: FiShield, label: "Secure", desc: "256-bit encrypted" },
                { icon: FiZap, label: "Instant", desc: "Activate in seconds" },
                { icon: FiStar, label: "Rewards", desc: "Earn cashback" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 text-center">
                  <Icon size={16} className="text-primary mx-auto mb-1.5" />
                  <p className="text-[10px] font-bold text-white">{label}</p>
                  <p className="text-[9px] text-[#848e9c] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowBuyModal(true)}
              className="w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
            >
              Get Your Card — Starting at $7
            </button>
          </>
        )}
      </div>

      {/* ── Buy Card Modal ─────────────────────────────────────────────────── */}
      {showBuyModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowBuyModal(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-[#161a1e] rounded-t-3xl sm:rounded-3xl border border-white/[0.06] shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 bg-[#161a1e] z-10 flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white">Choose Card Tier</h3>
              <button onClick={() => setShowBuyModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-[#848e9c]">
                <FiX size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {CARD_TIERS.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  selected={selectedTier.id === tier.id}
                  onClick={() => setSelectedTier(tier)}
                />
              ))}

              <div className="rounded-xl border border-white/[0.06] bg-[#0b0e11] p-3 mt-2">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#848e9c]">Selected tier</span>
                  <span className="font-bold text-white">{selectedTier.name}</span>
                </div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#848e9c]">Card price</span>
                  <span className="font-bold text-primary">${selectedTier.price} USDT</span>
                </div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#848e9c]">Initial card balance</span>
                  <span className="font-bold text-green-400">${selectedTier.initialBalance}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#848e9c]">Your USDT balance</span>
                  <span className={`font-bold ${usdtBalance >= selectedTier.price ? "text-white" : "text-red-400"}`}>
                    ${usdtBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBuyCard}
                disabled={buying || usdtBalance < selectedTier.price}
                className="w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {buying
                  ? "Activating..."
                  : usdtBalance < selectedTier.price
                  ? `Need $${(selectedTier.price - usdtBalance).toFixed(2)} more`
                  : `Activate ${selectedTier.name} Card — $${selectedTier.price}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top-up Modal ───────────────────────────────────────────────────── */}
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

            <div className="rounded-xl bg-[#0b0e11] border border-white/[0.06] p-3 mb-4">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-[#848e9c]">Funding balance (USDT)</span>
                <span className="font-bold text-white">${usdtBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#848e9c]">Current card balance</span>
                <span className="font-bold text-white">${card.balance.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#848e9c] mb-2">
                Amount (USDT)
              </label>
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-[#0b0e11] border border-white/[0.08] px-4 py-3 text-center text-xl font-bold text-white focus:outline-none focus:border-primary transition"
              />
            </div>

            <div className="flex gap-2 mb-4">
              {[5, 10, 20, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(String(amt))}
                  className="flex-1 rounded-xl bg-[#0b0e11] border border-white/[0.06] py-2 text-[10px] font-bold text-[#848e9c] hover:border-primary hover:text-primary transition"
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopup}
              disabled={topping || !topupAmount || parseFloat(topupAmount) <= 0 || parseFloat(topupAmount) > usdtBalance}
              className="w-full rounded-xl bg-primary py-3.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {topping ? "Processing..." : `Top Up $${topupAmount || "0"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
