"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FiDollarSign, FiRefreshCw, FiAlertTriangle, FiArrowUpRight,
  FiLock, FiCheck, FiX, FiArrowLeft, FiExternalLink, FiShield
} from "react-icons/fi";

type WalletAddress = {
  uid: string;
  address: string;
  balance: number;
  lastDepositAt: string;
};

type ModalState =
  | { type: "none" }
  | { type: "withdraw"; addr: WalletAddress }
  | { type: "resetPin" };

export default function AdminWalletPage() {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<{ totalUsdt: number; addresses: WalletAddress[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  // Withdraw modal state
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; txId?: string; error?: string } | null>(null);

  // Reset PIN state
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPin, setSavingPin] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openWithdraw = (addr: WalletAddress) => {
    setWithdrawDest("");
    setWithdrawAmount("");
    setWithdrawPin("");
    setWithdrawResult(null);
    setModal({ type: "withdraw", addr });
  };

  const handleWithdraw = async () => {
    if (modal.type !== "withdraw") return;
    if (!withdrawDest || !withdrawAmount || !withdrawPin) return;

    setWithdrawing(true);
    setWithdrawResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceAddress: modal.addr.address,
          destinationAddress: withdrawDest,
          amount: parseFloat(withdrawAmount),
          pin: withdrawPin,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setWithdrawResult({ success: true, txId: d.txId });
        loadData();
      } else {
        setWithdrawResult({ success: false, error: d.error });
      }
    } catch (e: any) {
      setWithdrawResult({ success: false, error: e.message || "Connection error" });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleResetPin = async () => {
    if (newPin !== confirmPin) {
      setPinMsg({ ok: false, text: "New PINs do not match." });
      return;
    }
    if (newPin.length < 4) {
      setPinMsg({ ok: false, text: "New PIN must be at least 4 characters." });
      return;
    }
    setSavingPin(true);
    setPinMsg(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "update", pin: oldPin, newPin }),
      });
      const d = await res.json();
      if (res.ok) {
        setPinMsg({ ok: true, text: "PIN updated successfully!" });
        setOldPin(""); setNewPin(""); setConfirmPin("");
      } else {
        setPinMsg({ ok: false, text: d.error || "Failed to update PIN." });
      }
    } catch (e) {
      setPinMsg({ ok: false, text: "Connection error." });
    } finally {
      setSavingPin(false);
    }
  };

  const closeModal = () => {
    setModal({ type: "none" });
    setWithdrawResult(null);
    setPinMsg(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Platform Wallet</h1>
          <p className="text-[11px] text-[#848e9c] mt-0.5">Real TRC20 USDT balances</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
        >
          <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Total USDT Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a2035] to-[#0d1017] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <FiDollarSign size={14} />
          </div>
          <p className="text-[11px] text-[#848e9c] font-medium">Total Real USDT Collected</p>
        </div>
        <p className="text-2xl font-bold text-white">
          {loading ? "..." : `$${(data?.totalUsdt ?? 0).toFixed(4)}`}
        </p>
        <p className="text-[10px] text-[#848e9c] mt-1">Across all user deposit addresses</p>
      </div>

      {/* Reset PIN Button */}
      <button
        onClick={() => { setPinMsg(null); setOldPin(""); setNewPin(""); setConfirmPin(""); setModal({ type: "resetPin" }); }}
        className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161a1e] px-4 py-3 transition hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-2">
          <FiShield size={14} className="text-primary" />
          <span className="text-xs font-semibold text-white">Change Wallet PIN</span>
        </div>
        <FiArrowLeft size={13} className="rotate-180 text-[#848e9c]" />
      </button>

      {/* Gas Warning */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-start gap-2">
        <FiAlertTriangle size={13} className="text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-yellow-300 leading-relaxed">
          <span className="font-bold">Important:</span> To withdraw USDT from any address, that address needs ~15–30 TRX for gas. Fund it with TRX first, then withdraw.
        </p>
      </div>

      {/* User Deposit Addresses */}
      <div>
        <p className="text-xs font-semibold text-[#848e9c] mb-2 uppercase tracking-wider">User Deposit Addresses</p>
        {loading ? (
          <div className="text-center py-10 text-[11px] text-[#848e9c]">Loading...</div>
        ) : !data?.addresses || data.addresses.length === 0 ? (
          <div className="text-center py-10 text-[11px] text-[#848e9c]">No deposit addresses found.</div>
        ) : (
          <div className="space-y-2">
            {data.addresses.map((addr) => (
              <div
                key={addr.address}
                className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#848e9c]">User ID</p>
                    <p className="text-[11px] font-mono text-white truncate">{addr.uid.slice(0, 14)}...</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#848e9c]">Balance</p>
                    <p className="text-xs font-bold text-primary">{addr.balance.toFixed(4)} USDT</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#848e9c]">TRC20 Address</p>
                  <p className="text-[10px] font-mono text-white/70 break-all">{addr.address}</p>
                </div>
                <button
                  onClick={() => openWithdraw(addr)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-xs font-bold text-primary transition hover:bg-primary/20"
                >
                  <FiArrowUpRight size={13} />
                  Withdraw USDT
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── WITHDRAW MODAL ── */}
      {modal.type === "withdraw" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {withdrawResult ? (
              // Result Screen
              <div className="text-center space-y-4 py-4">
                {withdrawResult.success ? (
                  <>
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                        <FiCheck size={30} />
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Withdrawal Sent!</p>
                      <p className="text-[11px] text-[#848e9c] mt-1">Transaction broadcast to TRON network</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3 text-left">
                      <p className="text-[10px] text-[#848e9c] mb-1">Transaction ID</p>
                      <p className="text-[10px] font-mono text-primary break-all">{withdrawResult.txId}</p>
                    </div>
                    <a
                      href={`https://tronscan.org/#/transaction/${withdrawResult.txId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-xs text-primary underline"
                    >
                      View on TronScan <FiExternalLink size={11} />
                    </a>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <FiX size={30} />
                      </div>
                    </div>
                    <p className="text-base font-bold text-white">Withdrawal Failed</p>
                    <p className="text-xs text-red-400">{withdrawResult.error}</p>
                    <p className="text-[10px] text-[#848e9c]">
                      Make sure the source address has enough TRX for gas fees (~15–30 TRX).
                    </p>
                  </>
                )}
                <button
                  onClick={closeModal}
                  className="w-full rounded-xl bg-white/[0.06] py-3 text-sm font-bold text-white hover:bg-white/[0.1]"
                >
                  Close
                </button>
              </div>
            ) : (
              // Form Screen
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">Withdraw USDT</h3>
                  <p className="text-[10px] text-[#848e9c] mt-0.5 font-mono break-all">
                    From: {modal.addr.address.slice(0, 12)}...{modal.addr.address.slice(-8)}
                  </p>
                  <p className="text-[10px] text-primary mt-0.5">
                    Available: {modal.addr.balance.toFixed(4)} USDT
                  </p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1">Destination Address (TRC20)</label>
                    <input
                      type="text"
                      value={withdrawDest}
                      onChange={(e) => setWithdrawDest(e.target.value)}
                      placeholder="T... (Binance/Bybit TRC20 address)"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1">Amount (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        max={modal.addr.balance}
                        step="0.01"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={() => setWithdrawAmount(modal.addr.balance.toFixed(6))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1">Admin PIN (required to confirm)</label>
                    <input
                      type="password"
                      value={withdrawPin}
                      onChange={(e) => setWithdrawPin(e.target.value)}
                      placeholder="••••••"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-2.5">
                  <p className="text-[10px] text-yellow-300 leading-relaxed">
                    <FiAlertTriangle size={10} className="inline mr-1" />
                    This sends <strong>real USDT</strong> on the TRON blockchain. This action cannot be reversed.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-white/[0.04] py-3 text-xs font-bold text-white hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !withdrawDest || !withdrawAmount || !withdrawPin}
                    className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-40"
                  >
                    {withdrawing ? "Sending..." : "Confirm Withdraw"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── RESET PIN MODAL ── */}
      {modal.type === "resetPin" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <FiLock size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Change Wallet PIN</h3>
            </div>
            <p className="text-[10px] text-[#848e9c]">
              Enter your current PIN, then set a new one. The default PIN is <strong className="text-white">123456</strong>.
            </p>

            <div className="space-y-2">
              <div>
                <label className="block text-[10px] text-[#848e9c] mb-1">Current PIN</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Current PIN"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#848e9c] mb-1">New PIN</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="New PIN (min 4 chars)"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#848e9c] mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest"
                />
              </div>
            </div>

            {pinMsg && (
              <p className={`text-[10px] font-medium ${pinMsg.ok ? "text-green-400" : "text-red-400"}`}>
                {pinMsg.text}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl bg-white/[0.04] py-3 text-xs font-bold text-white hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPin}
                disabled={savingPin || !oldPin || !newPin || !confirmPin}
                className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-40"
              >
                {savingPin ? "Saving..." : "Update PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
