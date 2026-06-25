"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiCheck, FiChevronDown, FiCopy, FiInfo } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import { appTheme } from "@/components/layout/app-theme";
import { authFetch } from "@/lib/auth/auth-fetch";

export default function CryptoDepositPage() {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Coin selection state
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState("USDT");

  useEffect(() => {
    // Generate or fetch TRC20 address
    authFetch("/api/deposit/tron/address")
      .then((res) => res.json())
      .then((data) => {
        if (data.address) setAddress(data.address);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load address", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!address) return;

    // Poll for balance updates every 10 seconds
    const interval = setInterval(() => {
      authFetch("/api/deposit/tron/check")
        .then((res) => res.json())
        .then((data) => {
          if (data.newDeposit) {
            setSuccessMsg(`Deposit successful! ${data.amountAdded} USDT added to your wallet.`);
            setTimeout(() => setSuccessMsg(null), 8000);
          }
        })
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [address]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Deposit Crypto</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        {successMsg && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500">
              <FiCheck size={14} />
            </div>
            <p className="text-xs font-medium text-green-400">{successMsg}</p>
          </div>
        )}

        {/* Coin Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-[10px] md:text-xs font-semibold text-[#848e9c]">
            Select Coin
          </label>
          <div className="relative">
            <button
              onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#161a1e] px-4 py-3 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-2">
                <img
                  src="https://assets.coingecko.com/coins/images/325/thumb/Tether.png"
                  alt="USDT"
                  className="h-5 w-5 rounded-full"
                />
                <span className="text-xs md:text-sm font-bold text-white">USDT</span>
                <span className="text-[10px] md:text-xs text-[#848e9c]">Tether US</span>
              </div>
              <FiChevronDown className={`text-[#848e9c] transition-transform ${coinDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            
            {coinDropdownOpen && (
              <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#161a1e] shadow-2xl">
                <button
                  className="flex w-full items-center gap-2 bg-[#0b0e11] px-4 py-3 transition hover:bg-white/[0.04]"
                  onClick={() => setCoinDropdownOpen(false)}
                >
                  <img
                    src="https://assets.coingecko.com/coins/images/325/thumb/Tether.png"
                    alt="USDT"
                    className="h-5 w-5 rounded-full"
                  />
                  <div className="text-left">
                    <div className="text-xs md:text-sm font-bold text-white">USDT</div>
                    <div className="text-[10px] text-[#848e9c]">Tether US</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Network Selection (Locked) */}
        <div className="mb-6">
          <label className="mb-2 block text-[10px] md:text-xs font-semibold text-[#848e9c]">
            Select Network
          </label>
          <div className="flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-bold text-primary">Tron (TRC20)</span>
              <span className="text-[10px] text-primary/70">Arrival time: ~1 min</span>
            </div>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
              <FiCheck size={12} />
            </div>
          </div>
        </div>

        {/* Address Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#161a1e] py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-4 text-xs text-[#848e9c]">Generating unique address...</p>
          </div>
        ) : address ? (
          <div className="rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 text-center shadow-lg">
            <div className="mx-auto mb-5 inline-block rounded-xl bg-white p-3">
              <QRCodeSVG value={address} size={150} level="M" includeMargin={false} />
            </div>

            <p className="mb-2 text-[10px] font-medium text-[#848e9c] uppercase tracking-wider">
              Deposit Address
            </p>
            <div className="mb-4 flex items-center justify-between rounded-lg bg-[#0b0e11] px-3 py-2.5">
              <span className="truncate text-xs font-medium text-white">{address}</span>
              <button
                onClick={copyAddress}
                className="ml-2 shrink-0 rounded-md p-1.5 text-[#848e9c] transition hover:bg-white/[0.06] hover:text-white"
              >
                {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3 text-left">
              <FiInfo className="mt-0.5 shrink-0 text-yellow-500" size={14} />
              <p className="text-[10px] text-yellow-500/90 leading-relaxed">
                Send only USDT to this deposit address. Sending coin or token other than USDT will result in the loss of your deposit.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
            <p className="text-xs text-red-400">Failed to generate deposit address. Please try again.</p>
          </div>
        )}
      </main>
    </div>
  );
}
