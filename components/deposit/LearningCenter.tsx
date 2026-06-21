"use client";

import { useState } from "react";
import { FiBookOpen, FiChevronDown, FiShield } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

const GUIDES = [
  {
    title: "Beginner Deposit Guide",
    body: "Choose your network, generate a deposit address, send USDT, and wait for automatic confirmation.",
  },
  {
    title: "How to Buy Crypto",
    body: "Use Buy Crypto or P2P options if you do not already hold digital assets.",
  },
  {
    title: "How to Deposit Crypto",
    body: "Only send USDT on the selected chain. Double-check the network before confirming your transfer.",
  },
  {
    title: "Crypto Safety Tips",
    body: "Never share your private keys. Verify the contract address and minimum deposit before sending funds.",
  },
];

export function LearningCenter() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <FiBookOpen className="text-primary" />
        <h2 className={appTheme.sectionTitle}>Learning Center</h2>
      </div>
      <div className={`${appTheme.card} divide-y divide-white/[0.06] p-0`}>
        {GUIDES.map((guide, index) => {
          const open = openIndex === index;
          return (
            <div key={guide.title}>
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition hover:bg-white/[0.02]"
              >
                <span className="text-sm font-medium text-white">{guide.title}</span>
                <FiChevronDown
                  className={`text-[#848e9c] transition ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-[#848e9c]">{guide.body}</div>
              )}
            </div>
          );
        })}
        <div className="flex items-start gap-2 px-4 py-3.5 text-xs text-[#848e9c]">
          <FiShield className="mt-0.5 shrink-0 text-secondary" />
          <span>Korixa never asks for your seed phrase or private keys.</span>
        </div>
      </div>
    </div>
  );
}
