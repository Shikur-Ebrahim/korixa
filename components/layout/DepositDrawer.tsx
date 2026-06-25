"use client";

import { useRouter } from "next/navigation";
import { FiX, FiBriefcase, FiDollarSign, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type DepositDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function DepositDrawer({ open, onClose }: DepositDrawerProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          type="button"
          aria-label="Close deposit options"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-2xl bg-[#161a1e] shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-4">
            <h2 className="text-sm md:text-base font-bold text-white">Select Payment Method</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06]"
            >
              <FiX />
            </button>
          </div>

          <div className="p-5 space-y-3 pb-8">
            {/* Deposit Crypto */}
            <button
              onClick={() => {
                onClose();
                router.push("/deposit/crypto");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.04] bg-[#0b0e11] p-4 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FiBriefcase size={20} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white">Deposit Crypto</h3>
                  <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
                    Transfer crypto from your on-chain wallet or another exchange.
                  </p>
                </div>
              </div>
              <FiChevronRight className="text-[#848e9c]" />
            </button>

            {/* P2P Trading */}
            <button
              onClick={() => {
                onClose();
                router.push("/p2p");
              }}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.04] bg-[#0b0e11] p-4 text-left transition hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <FiDollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-white">P2P Trading</h3>
                  <p className="text-[10px] md:text-xs text-[#848e9c] mt-0.5">
                    Buy with ETB via local bank transfers (CBE, Awash, etc).
                  </p>
                </div>
              </div>
              <FiChevronRight className="text-[#848e9c]" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
