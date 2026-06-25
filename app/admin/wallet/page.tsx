"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FiDollarSign, FiRefreshCw, FiAlertTriangle,
  FiArrowUpRight, FiCheck, FiX, FiExternalLink,
  FiShield, FiChevronDown, FiChevronUp, FiLock
} from "react-icons/fi";

type WalletAddress = {
  uid: string;
  address: string;
  balance: number;
  lastDepositAt: string;
};

type ModalState = "none" | "withdraw" | "resetPin";

export default function AdminWalletPage() {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<{ totalUsdt: number; addresses: WalletAddress[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>("none");
  const [selected, setSelected] = useState<WalletAddress | null>(null);
  const [showGasInfo, setShowGasInfo] = useState(false);

  // Withdraw form
  const [dest, setDest] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; txId?: string; error?: string } | null>(null);

  // Change PIN form
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
    setSelected(addr);
    setDest(""); setAmount(""); setPin(""); setResult(null);
    setModal("withdraw");
  };

  const handleWithdraw = async () => {
    if (!selected || !dest || !amount || !pin) return;
    setWithdrawing(true); setResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sourceAddress: selected.address,
          destinationAddress: dest,
          amount: parseFloat(amount),
          pin,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setResult({ success: true, txId: d.txId });
        loadData();
      } else {
        setResult({ success: false, error: d.error });
      }
    } catch (e: any) {
      setResult({ success: false, error: "Connection error. Please try again." });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleResetPin = async () => {
    if (newPin !== confirmPin) { setPinMsg({ ok: false, text: "PINs do not match." }); return; }
    if (newPin.length < 4) { setPinMsg({ ok: false, text: "PIN must be at least 4 digits." }); return; }
    setSavingPin(true); setPinMsg(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "update", pin: oldPin, newPin }),
      });
      const d = await res.json();
      if (res.ok) { setPinMsg({ ok: true, text: "PIN updated!" }); setOldPin(""); setNewPin(""); setConfirmPin(""); }
      else setPinMsg({ ok: false, text: d.error || "Failed." });
    } catch { setPinMsg({ ok: false, text: "Connection error." }); }
    finally { setSavingPin(false); }
  };

  const closeModal = () => { setModal("none"); setResult(null); setSelected(null); setPinMsg(null); };

  const isGasError = (msg: string) =>
    ["resource", "bandwidth", "energy", "trx", "fee", "balance"].some(w => msg.toLowerCase().includes(w));

  return (
    <div className="space-y-4 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Platform Wallet</h1>
          <p className="text-[11px] text-[#848e9c] mt-0.5">Real TRC20 USDT balances</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPinMsg(null); setOldPin(""); setNewPin(""); setConfirmPin(""); setModal("resetPin"); }}
            className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-3 py-2 text-xs text-white transition hover:bg-white/[0.08]"
          >
            <FiShield size={11} className="text-primary" /> PIN
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
          >
            <FiRefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Total Balance */}
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#1a2035] to-[#0d1017] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <FiDollarSign size={14} />
          </div>
          <p className="text-[11px] text-[#848e9c]">Total Real USDT Collected</p>
        </div>
        <p className="text-2xl font-bold text-white">{loading ? "..." : `$${(data?.totalUsdt ?? 0).toFixed(4)}`}</p>
        <p className="text-[10px] text-[#848e9c] mt-1">Across all user deposit addresses</p>
      </div>

      {/* Gas Fee Info */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-3 py-3"
          onClick={() => setShowGasInfo(!showGasInfo)}
        >
          <div className="flex items-center gap-2">
            <FiAlertTriangle size={12} className="text-yellow-400 shrink-0" />
            <p className="text-[10px] font-bold text-yellow-400">About TRX Gas Fees</p>
          </div>
          {showGasInfo ? <FiChevronUp size={12} className="text-yellow-400" /> : <FiChevronDown size={12} className="text-yellow-400" />}
        </button>
        {showGasInfo && (
          <div className="px-3 pb-3 space-y-2">
            <p className="text-[10px] text-yellow-200 leading-relaxed">
              <strong>Why does withdrawal need TRX?</strong> The TRON blockchain requires a small fee called "energy" to process every TRC20 transaction. This fee is paid in TRX (TRON coin) — not USDT. There is no way to bypass this. It is a TRON network rule.
            </p>
            <p className="text-[10px] text-yellow-200 leading-relaxed">
              <strong>How much TRX do I need?</strong> Around 15–30 TRX per withdrawal (roughly $1–2). This is a one-time per-withdrawal cost.
            </p>
            <p className="text-[10px] text-yellow-200 leading-relaxed">
              <strong>What if withdrawal fails?</strong> It means the source address has 0 TRX. Go to your Binance/Bybit → Withdraw → TRX → Network: TRC20 → paste the source address → send 20 TRX → wait 2 min → retry.
            </p>
            <p className="text-[10px] text-yellow-300 font-semibold">
              If a user deposited $100 USDT, you will receive ~$98–99 after the TRX gas cost. The TRX is NOT deducted from USDT — it is a separate coin fee.
            </p>
          </div>
        )}
      </div>

      {/* User Deposit Addresses */}
      <div>
        <p className="text-[10px] font-semibold text-[#848e9c] uppercase tracking-wider mb-2">User Deposit Addresses</p>

        {loading ? (
          <div className="text-center py-8 text-[11px] text-[#848e9c]">Loading addresses...</div>
        ) : !data?.addresses || data.addresses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center">
            <p className="text-[11px] text-[#848e9c]">No crypto deposits yet.</p>
            <p className="text-[10px] text-[#636d79] mt-1">When a user deposits via crypto, their wallet appears here with a Withdraw button.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.addresses.map((addr) => (
              <div key={addr.address} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 space-y-2.5">
                {/* User + Balance row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-[#848e9c]">User ID</p>
                    <p className="text-[10px] font-mono text-white">{addr.uid.slice(0, 16)}...</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#848e9c]">USDT Balance</p>
                    <p className="text-sm font-bold text-primary">{addr.balance.toFixed(4)}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-lg bg-[#0b0e11] px-2.5 py-2">
                  <p className="text-[10px] text-[#848e9c] mb-0.5">TRC20 Deposit Address</p>
                  <p className="text-[10px] font-mono text-white/70 break-all">{addr.address}</p>
                </div>

                {/* Last deposit */}
                {addr.lastDepositAt && (
                  <p className="text-[9px] text-[#636d79]">
                    Last deposit: {new Date(addr.lastDepositAt).toLocaleDateString()}
                  </p>
                )}

                {/* Withdraw Button */}
                <button
                  onClick={() => openWithdraw(addr)}
                  disabled={addr.balance <= 0}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-[#0b0e11] transition hover:bg-primary/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <FiArrowUpRight size={13} />
                  Withdraw {addr.balance.toFixed(2)} USDT
                </button>

                {addr.balance <= 0 && (
                  <p className="text-[9px] text-[#636d79] text-center">Balance is zero — nothing to withdraw</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── WITHDRAW MODAL ── */}
      {modal === "withdraw" && selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-t-3xl border-t border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {result ? (
              /* Result Screen */
              <div className="text-center space-y-4 py-2">
                {result.success ? (
                  <>
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                        <FiCheck size={28} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Withdrawal Successful!</p>
                      <p className="text-[10px] text-[#848e9c] mt-1">USDT sent on TRON network</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.04] p-3 text-left">
                      <p className="text-[10px] text-[#848e9c] mb-1">Transaction ID</p>
                      <p className="text-[10px] font-mono text-primary break-all">{result.txId}</p>
                    </div>
                    <a
                      href={`https://tronscan.org/#/transaction/${result.txId}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1 text-xs text-primary underline"
                    >
                      Verify on TronScan <FiExternalLink size={10} />
                    </a>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                        <FiX size={28} />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">Withdrawal Failed</p>
                    <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-left">
                      <p className="text-[10px] text-red-300">{result.error}</p>
                    </div>
                    {result.error && isGasError(result.error) && (
                      <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3 text-left space-y-1.5">
                        <p className="text-[10px] font-bold text-yellow-400">Fix: Send TRX for Gas</p>
                        <ol className="text-[10px] text-yellow-200 space-y-1 list-decimal list-inside">
                          <li>Open Binance or Bybit</li>
                          <li>Withdraw → Select <strong>TRX</strong> → Network: <strong>TRC20</strong></li>
                          <li>Paste this address:<br /><span className="font-mono text-yellow-300 break-all">{selected.address}</span></li>
                          <li>Send <strong>20 TRX</strong></li>
                          <li>Wait 2 minutes, then try again</li>
                        </ol>
                      </div>
                    )}
                  </>
                )}
                <button onClick={closeModal} className="w-full rounded-xl bg-white/[0.06] py-3 text-xs font-bold text-white hover:bg-white/[0.08]">
                  Close
                </button>
              </div>
            ) : (
              /* Withdrawal Form */
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">Withdraw USDT</h3>
                  <div className="mt-2 rounded-lg bg-white/[0.03] p-2.5 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#848e9c]">From</span>
                      <span className="text-[10px] font-mono text-white">{selected.address.slice(0, 10)}...{selected.address.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#848e9c]">Available</span>
                      <span className="text-[10px] font-bold text-primary">{selected.balance.toFixed(4)} USDT</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1.5">Destination Address (TRC20)</label>
                    <input
                      type="text"
                      value={dest}
                      onChange={(e) => setDest(e.target.value)}
                      placeholder="T... (your Binance/Bybit TRC20 address)"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1.5">Amount (USDT)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        max={selected.balance}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
                      />
                      <button
                        onClick={() => setAmount(selected.balance.toFixed(6))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary hover:text-primary/80"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#848e9c] mb-1.5">Admin PIN</label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Enter PIN to confirm"
                      className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-sm text-white outline-none focus:border-primary/50 text-center tracking-[0.3em]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-2.5">
                  <p className="text-[10px] text-yellow-300 leading-relaxed">
                    <FiAlertTriangle size={9} className="inline mr-1" />
                    Sends real USDT on TRON. Cannot be reversed. Source address must have ~20 TRX for gas.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 rounded-xl bg-white/[0.04] py-3.5 text-xs font-bold text-white hover:bg-white/[0.08]">
                    Cancel
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing || !dest || !amount || !pin}
                    className="flex-1 rounded-xl bg-primary py-3.5 text-xs font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-40"
                  >
                    {withdrawing ? "Sending..." : "Confirm Withdraw"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── CHANGE PIN MODAL ── */}
      {modal === "resetPin" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-t-3xl border-t border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <FiLock size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Change Wallet PIN</h3>
            </div>
            <p className="text-[10px] text-[#848e9c]">Default PIN is <strong className="text-white">123456</strong>.</p>
            <div className="space-y-2">
              {[
                { label: "Current PIN", val: oldPin, set: setOldPin },
                { label: "New PIN", val: newPin, set: setNewPin },
                { label: "Confirm New PIN", val: confirmPin, set: setConfirmPin },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-[10px] text-[#848e9c] mb-1">{label}</label>
                  <input type="password" value={val} onChange={(e) => set(e.target.value)} placeholder="••••••"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-sm text-white outline-none focus:border-primary/50 text-center tracking-[0.3em]" />
                </div>
              ))}
            </div>
            {pinMsg && <p className={`text-[10px] ${pinMsg.ok ? "text-green-400" : "text-red-400"}`}>{pinMsg.text}</p>}
            <div className="flex gap-2">
              <button onClick={closeModal} className="flex-1 rounded-xl bg-white/[0.04] py-3.5 text-xs font-bold text-white">Cancel</button>
              <button onClick={handleResetPin} disabled={savingPin || !oldPin || !newPin || !confirmPin}
                className="flex-1 rounded-xl bg-primary py-3.5 text-xs font-bold text-[#0b0e11] disabled:opacity-40">
                {savingPin ? "Saving..." : "Update PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
