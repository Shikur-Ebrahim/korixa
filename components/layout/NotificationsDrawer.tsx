"use client";

import { FiBell, FiX } from "react-icons/fi";

type NotificationsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Close notifications"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 top-0 mx-auto flex max-h-[70vh] w-full max-w-lg flex-col rounded-b-2xl bg-[#161a1e] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <h2 className="text-lg font-bold text-white">Notifications</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#848e9c] hover:bg-white/[0.06]"
          >
            <FiX />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#0b0e11] text-[#848e9c]">
            <FiBell className="text-xl" />
          </div>
          <p className="text-sm font-medium text-white">No notifications yet</p>
          <p className="mt-1 text-xs text-[#848e9c]">
            Price alerts, KYC updates, and trade confirmations will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
