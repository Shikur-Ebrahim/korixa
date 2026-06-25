"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  FiDollarSign, FiRefreshCw, FiAlertTriangle, FiArrowUpRight,
  FiLock, FiCheck, FiX, FiExternalLink, FiShield, FiInfo,
  FiChevronDown, FiChevronUp, FiCopy
} from "react-icons/fi";

type WalletAddress = {
  uid: string;
  address: string;
  balance: number;
  lastDepositAt: string;
};

type ModalState = "none" | "withdraw-direct" | "withdraw-address" | "resetPin";

export default function AdminWalletPage() {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<{ totalUsdt: number; addresses: WalletAddress[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>("none");
  const [selectedAddr, setSelectedAddr] = useState<WalletAddress | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Withdraw state
  const [withdrawDest, setWithdrawDest] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");
  const [withdrawPrivKey, setWithdrawPrivKey] = useState(""); // for direct withdrawal
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

  const openDirectWithdraw = () => {
    setWithdrawDest(""); setWithdrawAmount(""); setWithdrawPin("");
    setWithdrawPrivKey(""); setWithdrawResult(null);
    setModal("withdraw-direct");
  };

  const openAddressWithdraw = (addr: WalletAddress) => {
    setSelectedAddr(addr);
    setWithdrawDest(""); setWithdrawAmount(""); setWithdrawPin("");
    setWithdrawResult(null);
    setModal("withdraw-address");
  };

  const handleDirectWithdraw = async () => {
    if (!withdrawPrivKey || !withdrawDest || !withdrawAmount || !withdrawPin) return;
    setWithdrawing(true);
    setWithdrawResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/withdraw-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          privateKey: withdrawPrivKey,
          destinationAddress: withdrawDest,
          amount: parseFloat(withdrawAmount),
          pin: withdrawPin,
        }),
      });
      const d = await res.json();
      setWithdrawResult(res.ok ? { success: true, txId: d.txId } : { success: false, error: d.error });
      if (res.ok) loadData();
    } catch (e: any) {
      setWithdrawResult({ success: false, error: e.message || "Connection error" });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleAddressWithdraw = async () => {
    if (!selectedAddr || !withdrawDest || !withdrawAmount || !withdrawPin) return;
    setWithdrawing(true);
    setWithdrawResult(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sourceAddress: selectedAddr.address,
          destinationAddress: withdrawDest,
          amount: parseFloat(withdrawAmount),
          pin: withdrawPin,
        }),
      });
      const d = await res.json();
      setWithdrawResult(res.ok ? { success: true, txId: d.txId } : { success: false, error: d.error });
      if (res.ok) loadData();
    } catch (e: any) {
      setWithdrawResult({ success: false, error: e.message || "Connection error" });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleResetPin = async () => {
    if (newPin !== confirmPin) { setPinMsg({ ok: false, text: "New PINs do not match." }); return; }
    if (newPin.length < 4) { setPinMsg({ ok: false, text: "New PIN must be at least 4 characters." }); return; }
    setSavingPin(true); setPinMsg(null);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/admin/wallet/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "update", pin: oldPin, newPin }),
      });
      const d = await res.json();
      if (res.ok) { setPinMsg({ ok: true, text: "PIN updated successfully!" }); setOldPin(""); setNewPin(""); setConfirmPin(""); }
      else setPinMsg({ ok: false, text: d.error || "Failed." });
    } catch { setPinMsg({ ok: false, text: "Connection error." }); }
    finally { setSavingPin(false); }
  };

  const closeModal = () => { setModal("none"); setWithdrawResult(null); setPinMsg(null); setSelectedAddr(null); };

  const ResultScreen = () => (
    <div className="text-center space-y-4 py-2">
      {withdrawResult?.success ? (
        <>
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <FiCheck size={26} />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Withdrawal Sent!</p>
            <p className="text-[10px] text-[#848e9c] mt-1">Broadcast on TRON blockchain</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 text-left">
            <p className="text-[10px] text-[#848e9c] mb-1">Transaction ID (TXID)</p>
            <p className="text-[10px] font-mono text-primary break-all">{withdrawResult.txId}</p>
          </div>
          <a href={`https://tronscan.org/#/transaction/${withdrawResult.txId}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-1 text-xs text-primary underline">
            Verify on TronScan <FiExternalLink size={11} />
          </a>
        </>
      ) : (
        <>
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <FiX size={26} />
            </div>
          </div>
          <p className="text-sm font-bold text-white">Withdrawal Failed</p>
          <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-left">
            <p className="text-[10px] text-red-400 font-medium mb-1">Error:</p>
            <p className="text-[10px] text-red-300">{withdrawResult?.error}</p>
          </div>
          {withdrawResult?.error?.toLowerCase().includes("trx") || withdrawResult?.error?.toLowerCase().includes("energy") ||
           withdrawResult?.error?.toLowerCase().includes("balance") || withdrawResult?.error?.toLowerCase().includes("fee") ? (
            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3 text-left space-y-1">
              <p className="text-[10px] font-bold text-yellow-400 flex items-center gap-1"><FiAlertTriangle size={10} /> Gas Fee Fix:</p>
              <p className="text-[10px] text-yellow-300">The source wallet has no TRX for gas. Do this:</p>
              <ol className="text-[10px] text-yellow-200 space-y-0.5 list-decimal list-inside">
                <li>Go to your exchange (Binance/Bybit)</li>
                <li>Withdraw exactly <strong>20 TRX</strong> to this source address</li>
                <li>Wait 1–2 minutes for it to arrive</li>
                <li>Come back and try the withdrawal again</li>
              </ol>
            </div>
          ) : null}
        </>
      )}
      <button onClick={closeModal} className="w-full rounded-xl bg-white/[0.06] py-3 text-xs font-bold text-white hover:bg-white/[0.1]">
        Close
      </button>
    </div>
  );

  const WithdrawForm = ({ onSubmit, maxBalance }: { onSubmit: () => void; maxBalance?: number }) => (
    <div className="space-y-3">
      {modal === "withdraw-direct" && (
        <div>
          <label className="block text-[10px] text-[#848e9c] mb-1">Source Private Key</label>
          <textarea
            value={withdrawPrivKey}
            onChange={(e) => setWithdrawPrivKey(e.target.value)}
            placeholder="Paste the private key of the TRC20 wallet you want to withdraw from"
            rows={2}
            className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-2.5 text-[10px] text-white outline-none focus:border-primary/50 font-mono resize-none"
          />
          <p className="text-[10px] text-[#848e9c] mt-1">This key is never stored. It is only used once to sign this transaction.</p>
        </div>
      )}
      <div>
        <label className="block text-[10px] text-[#848e9c] mb-1">Destination Address (TRC20)</label>
        <input
          type="text"
          value={withdrawDest}
          onChange={(e) => setWithdrawDest(e.target.value)}
          placeholder="T... (your Binance/Bybit TRC20 deposit address)"
          className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-2.5 text-[10px] text-white outline-none focus:border-primary/50 font-mono"
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
            step="0.01"
            className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-2.5 text-xs text-white outline-none focus:border-primary/50"
          />
          {maxBalance !== undefined && (
            <button onClick={() => setWithdrawAmount(maxBalance.toFixed(6))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">MAX</button>
          )}
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-[#848e9c] mb-1">Admin PIN</label>
        <input
          type="password"
          value={withdrawPin}
          onChange={(e) => setWithdrawPin(e.target.value)}
          placeholder="Enter PIN to confirm"
          className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-2.5 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest"
        />
      </div>
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-2.5">
        <p className="text-[10px] text-yellow-300 leading-relaxed">
          <FiAlertTriangle size={10} className="inline mr-1" />
          This sends <strong>real USDT</strong> on TRON blockchain. Cannot be reversed. Requires ~20 TRX for gas in the source wallet.
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={closeModal} className="flex-1 rounded-xl bg-white/[0.04] py-3 text-xs font-bold text-white hover:bg-white/[0.08]">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={withdrawing || !withdrawDest || !withdrawAmount || !withdrawPin || (modal === "withdraw-direct" && !withdrawPrivKey)}
          className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-[#0b0e11] hover:bg-primary/90 disabled:opacity-40"
        >
          {withdrawing ? "Sending..." : "Confirm Withdraw"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white">Platform Wallet</h1>
          <p className="text-[11px] text-[#848e9c] mt-0.5">Real TRC20 USDT control</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]">
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
        <p className="text-2xl font-bold text-white">{loading ? "..." : `$${(data?.totalUsdt ?? 0).toFixed(4)}`}</p>
        <p className="text-[10px] text-[#848e9c] mt-1">Across all user deposit addresses</p>
      </div>

      {/* ── DIRECT WITHDRAW BUTTON ── */}
      <button
        onClick={openDirectWithdraw}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-[#0b0e11] transition hover:bg-primary/90 active:scale-95"
      >
        <FiArrowUpRight size={16} />
        Withdraw USDT Now
      </button>

      {/* How to Withdraw Guide */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <FiInfo size={13} className="text-primary" />
            <span className="text-xs font-semibold text-white">How to Withdraw — Full Guide</span>
          </div>
          {showGuide ? <FiChevronUp size={13} className="text-[#848e9c]" /> : <FiChevronDown size={13} className="text-[#848e9c]" />}
        </button>

        {showGuide && (
          <div className="px-4 pb-4 space-y-3">
            <div className="rounded-xl bg-[#0b0e11] p-3 space-y-2.5">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Step-by-Step Withdrawal Process</p>

              {[
                { step: "1", title: "Find the source private key", desc: "When a user generates a crypto deposit address in the app, their private key is stored securely in Firestore. Go to Firebase Console → Firestore → users → [user ID] → deposit_addresses to find the private key, or use the 'Withdraw' button on the address card below." },
                { step: "2", title: "Check TRX gas balance", desc: "The source TRC20 wallet needs ~20 TRX for gas. Go to TronScan.org, paste the source address, and check the TRX balance. If it shows 0 TRX — you MUST send 20 TRX to it first before withdrawing USDT." },
                { step: "3", title: "Send TRX for gas (if needed)", desc: "Go to Binance or Bybit → Withdraw → Select TRX → Network: TRC20 → Paste the source address → Send exactly 20 TRX. Wait 1-3 minutes for it to arrive." },
                { step: "4", title: "Click 'Withdraw USDT Now'", desc: "Click the orange button above. Paste the private key of the source wallet, enter your Binance/Bybit TRC20 deposit address as destination, enter the amount, and confirm with your Admin PIN." },
                { step: "5", title: "Confirm on TronScan", desc: "After success, you get a Transaction ID (TXID). Click the TronScan link to verify the transaction is confirmed on-chain. USDT typically arrives in your exchange in 1-5 minutes." },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold mt-0.5">{step}</div>
                  <div>
                    <p className="text-[10px] font-bold text-white">{title}</p>
                    <p className="text-[10px] text-[#848e9c] leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gas fee explainer */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-yellow-400 flex items-center gap-1">
                <FiAlertTriangle size={10} /> What is TRX Gas & Why Do I Need It?
              </p>
              <p className="text-[10px] text-yellow-200 leading-relaxed">
                TRON blockchain charges a small fee called "energy/bandwidth" for every transaction. This fee is paid in TRX (TRON's native coin). USDT itself cannot pay for this fee — only TRX can. Without TRX in the source wallet, the withdrawal will fail with an error like "Account does not have enough resources".
              </p>
              <p className="text-[10px] text-yellow-300 font-semibold">
                Fix: Send 20 TRX to the source address → Wait 2 min → Retry withdrawal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change PIN */}
      <button
        onClick={() => { setPinMsg(null); setOldPin(""); setNewPin(""); setConfirmPin(""); setModal("resetPin"); }}
        className="w-full flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#161a1e] px-4 py-3 transition hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-2">
          <FiShield size={13} className="text-primary" />
          <span className="text-xs font-semibold text-white">Change Wallet PIN</span>
        </div>
        <span className="text-[10px] text-[#848e9c]">→</span>
      </button>

      {/* User Deposit Addresses */}
      <div>
        <p className="text-[10px] font-semibold text-[#848e9c] mb-2 uppercase tracking-wider">User Deposit Addresses</p>
        {loading ? (
          <div className="text-center py-8 text-[11px] text-[#848e9c]">Loading...</div>
        ) : !data?.addresses || data.addresses.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-4 text-center">
            <p className="text-[11px] text-[#848e9c]">No user crypto deposits yet.</p>
            <p className="text-[10px] text-[#636d79] mt-1">When users deposit via TRC20, their addresses appear here with a Withdraw button.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.addresses.map((addr) => (
              <div key={addr.address} className="rounded-xl border border-white/[0.06] bg-[#161a1e] p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#848e9c]">User</p>
                    <p className="text-[10px] font-mono text-white">{addr.uid.slice(0, 12)}...</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#848e9c]">Balance</p>
                    <p className="text-xs font-bold text-primary">{addr.balance.toFixed(4)} USDT</p>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-white/60 break-all">{addr.address}</p>
                <button
                  onClick={() => openAddressWithdraw(addr)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2 text-[11px] font-bold text-primary transition hover:bg-primary/20"
                >
                  <FiArrowUpRight size={12} />
                  Withdraw from This Address
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {(modal === "withdraw-direct" || modal === "withdraw-address") && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-t-3xl border-t border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            {withdrawResult ? <ResultScreen /> : (
              <>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {modal === "withdraw-direct" ? "Withdraw USDT (Any Wallet)" : "Withdraw USDT"}
                  </h3>
                  {modal === "withdraw-address" && selectedAddr && (
                    <p className="text-[10px] text-primary mt-0.5">
                      From: {selectedAddr.address.slice(0, 14)}... · {selectedAddr.balance.toFixed(4)} USDT available
                    </p>
                  )}
                </div>
                <WithdrawForm
                  onSubmit={modal === "withdraw-direct" ? handleDirectWithdraw : handleAddressWithdraw}
                  maxBalance={modal === "withdraw-address" ? selectedAddr?.balance : undefined}
                />
              </>
            )}
          </div>
        </div>
      )}

      {modal === "resetPin" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-t-3xl border-t border-white/[0.08] bg-[#0b0e11] p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <FiLock size={15} className="text-primary" />
              <h3 className="text-sm font-bold text-white">Change Wallet PIN</h3>
            </div>
            <p className="text-[10px] text-[#848e9c]">Default PIN is <strong className="text-white">123456</strong>. Enter it as the current PIN if you haven't changed it yet.</p>
            <div className="space-y-2">
              {[
                { label: "Current PIN", val: oldPin, set: setOldPin },
                { label: "New PIN", val: newPin, set: setNewPin },
                { label: "Confirm New PIN", val: confirmPin, set: setConfirmPin },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-[10px] text-[#848e9c] mb-1">{label}</label>
                  <input type="password" value={val} onChange={(e) => set(e.target.value)} placeholder="••••••"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#161a1e] px-3 py-3 text-xs text-white outline-none focus:border-primary/50 text-center tracking-widest" />
                </div>
              ))}
            </div>
            {pinMsg && <p className={`text-[10px] ${pinMsg.ok ? "text-green-400" : "text-red-400"}`}>{pinMsg.text}</p>}
            <div className="flex gap-2">
              <button onClick={closeModal} className="flex-1 rounded-xl bg-white/[0.04] py-3 text-xs font-bold text-white">Cancel</button>
              <button onClick={handleResetPin} disabled={savingPin || !oldPin || !newPin || !confirmPin}
                className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-[#0b0e11] disabled:opacity-40">
                {savingPin ? "Saving..." : "Update PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
