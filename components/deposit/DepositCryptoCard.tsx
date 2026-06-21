"use client";

import { motion } from "framer-motion";
import { FiAlertTriangle, FiCheck, FiCopy } from "react-icons/fi";
import { useState } from "react";
import { ChainSelector } from "@/components/deposit/ChainSelector";
import { DepositAddressCard } from "@/components/deposit/DepositAddressCard";
import { DepositStatusTracker } from "@/components/deposit/DepositStatusTracker";
import { QRCodeDisplay } from "@/components/deposit/QRCodeDisplay";
import type { DepositChain } from "@/lib/deposit/constants";
import { MIN_DEPOSIT_USDT } from "@/lib/deposit/constants";
import type { CreateAddressResponse, DepositRecord } from "@/lib/deposit/types";
import { appTheme } from "@/components/layout/app-theme";

type DepositCryptoCardProps = {
  chain: DepositChain;
  onChainChange: (chain: DepositChain) => void;
  addressData: CreateAddressResponse | null;
  deposits: DepositRecord[];
  loadingAddress: boolean;
  loadingStatus: boolean;
  error: string | null;
  onGenerate: () => void;
};

export function DepositCryptoCard({
  chain,
  onChainChange,
  addressData,
  deposits,
  loadingAddress,
  loadingStatus,
  error,
  onGenerate,
}: DepositCryptoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!addressData?.walletAddress) return;
    await navigator.clipboard.writeText(addressData.walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${appTheme.card} overflow-hidden p-0`}>
      <div className="p-4">
        <p className="text-sm font-semibold text-white">Deposit Crypto</p>
        <p className="mt-1 text-xs leading-relaxed text-[#848e9c]">
          Generate a real blockchain deposit address for USDT on BSC or Polygon. Deposits are
          detected automatically and credited to your balance.
        </p>

        {!expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={`${appTheme.btnPrimary} mt-4 w-full`}
          >
            Deposit Crypto
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 space-y-4"
          >
            <ChainSelector
              value={chain}
              onChange={onChainChange}
              disabled={loadingAddress}
            />

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5">
              <div className="flex gap-2">
                <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-relaxed text-amber-100/90">
                  Send only <strong>USDT</strong> on the selected network. Sending other tokens or
                  using the wrong chain may result in permanent loss.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[#848e9c]">
              Minimum deposit: <span className="text-white">{MIN_DEPOSIT_USDT} USDT</span>
            </p>

            {!addressData && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={loadingAddress}
                className={`${appTheme.btnPrimary} w-full disabled:opacity-50`}
              >
                {loadingAddress ? "Generating address..." : "Generate Deposit Address"}
              </button>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}

            {addressData && (
              <div className="space-y-4">
                <QRCodeDisplay qrCode={addressData.qrCode} loading={loadingAddress} />
                <DepositAddressCard
                  address={addressData.walletAddress}
                  networkLabel={addressData.networkLabel}
                  token={addressData.token}
                  minDeposit={addressData.minDeposit}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#0b0e11] py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                >
                  {copied ? <FiCheck className="text-secondary" /> : <FiCopy />}
                  {copied ? "Address Copied" : "Copy Address"}
                </button>
              </div>
            )}

            <DepositStatusTracker deposits={deposits} loading={loadingStatus} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
