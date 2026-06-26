"use client";

import { FiBell, FiX, FiDownload, FiUpload, FiActivity, FiRepeat, FiGift } from "react-icons/fi";
import { TransactionRecord } from "@/lib/profile/wallet-service";

type NotificationsDrawerProps = {
  open: boolean;
  onClose: () => void;
  notifications?: TransactionRecord[];
};

export function NotificationsDrawer({ open, onClose, notifications = [] }: NotificationsDrawerProps) {
  if (!open) return null;

  const getTypeIcon = (type: string) => {
    if (["deposit", "crypto_deposit", "p2p_buy"].includes(type)) return <FiDownload className="text-green-500" />;
    if (["withdrawal", "p2p_sell"].includes(type)) return <FiUpload className="text-red-500" />;
    if (type === "trade") return <FiActivity className="text-primary" />;
    if (type === "transfer") return <FiRepeat className="text-blue-500" />;
    if (type === "reward") return <FiGift className="text-purple-500" />;
    return <FiRepeat className="text-gray-400" />;
  };

  const formatMessage = (tx: TransactionRecord) => {
    if (tx.type === "deposit" || tx.type === "crypto_deposit") {
      return `Your deposit of ${tx.amount} ${tx.coin} has been ${tx.status}.`;
    }
    if (tx.type === "p2p_buy") {
      return `P2P Buy order for ${tx.amount} USDT is ${tx.status}.`;
    }
    if (tx.type === "p2p_sell") {
      return `P2P Sell order for ${tx.amount} USDT is ${tx.status}.`;
    }
    if (tx.type === "withdrawal") {
      return `Your withdrawal of ${tx.amount} ${tx.coin} is ${tx.status}.`;
    }
    if (tx.type === "trade") {
      return `Spot trade executed: ${tx.amount} ${tx.coin}.`;
    }
    if (tx.type === "transfer") {
      return `Internal transfer of ${tx.amount} ${tx.coin} ${tx.status}.`;
    }
    return `Transaction of ${tx.amount} ${tx.coin} is ${tx.status}.`;
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 top-0 mx-auto flex max-h-[85vh] w-full max-w-lg flex-col rounded-b-2xl bg-[#161a1e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4 shrink-0">
          <h2 className="text-base md:text-lg font-bold text-white">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06]"
          >
            <FiX />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-2 md:p-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center h-full">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b0e11] text-[#848e9c]">
                <FiBell className="text-xl" />
              </div>
              <p className="text-sm md:text-base font-bold text-white">No notifications yet</p>
              <p className="mt-2 text-[10px] md:text-xs text-[#848e9c]">
                Price alerts, KYC updates, and trade confirmations will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((tx) => (
                <div key={tx.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#0b0e11] border border-white/[0.04] hover:border-white/[0.08] transition">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161a1e] border border-white/[0.04]">
                    {getTypeIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs md:text-sm font-bold text-white mb-0.5 line-clamp-2 leading-snug">
                      {formatMessage(tx)}
                    </p>
                    <p className="text-[10px] md:text-xs text-[#848e9c]">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {tx.status === "completed" && (
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  )}
                  {tx.status === "pending" && (
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
