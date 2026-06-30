"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiArrowLeft, FiMessageCircle, FiMail, FiChevronDown } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

const FAQS = [
  {
    question: "How do I add a payment method?",
    answer: "Go to Profile > Payment Methods, and click 'Add Payment Method'. Make sure your account name matches your verified KYC identity."
  },
  {
    question: "How long do P2P trades take?",
    answer: "Most P2P trades are completed within 5-15 minutes. If the buyer or seller is unresponsive, you can open an appeal after the timer expires."
  },
  {
    question: "Why was my identity verification rejected?",
    answer: "Verification usually fails due to blurry images, expired documents, or name mismatch. You can retry the verification process from the KYC page."
  },
  {
    question: "How do I secure my account?",
    answer: "We highly recommend setting up an Anti-Phishing Code in the Security Center. Coming soon: 2FA via Authenticator Apps."
  }
];

export default function SupportPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className={appTheme.page}>
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Support & FAQ</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        <div className="mb-6">
          <h1 className={appTheme.title}>How can we help?</h1>
          <p className={appTheme.subtitle}>
            Contact our support team or browse the frequently asked questions.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button 
            onClick={() => router.push(window.location.pathname + "?support=open")}
            className="flex flex-col items-center justify-center gap-3 rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 transition hover:bg-white/[0.04]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FiMessageCircle size={24} />
            </div>
            <span className="text-xs md:text-sm font-bold text-white">Live Chat</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5 transition hover:bg-white/[0.04]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <FiMail size={24} />
            </div>
            <span className="text-xs md:text-sm font-bold text-white">Email Us</span>
          </button>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-xs md:text-sm font-bold text-white mb-3 px-1">Frequently Asked Questions</h2>
          <div className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] divide-y divide-white/[0.04]">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/[0.02]"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="text-xs md:text-sm font-semibold text-[#eaecef] pr-4">
                    {faq.question}
                  </span>
                  <FiChevronDown 
                    className={`text-[#848e9c] transition-transform duration-200 shrink-0 ${openFaq === idx ? "rotate-180" : ""}`} 
                  />
                </button>
                <div 
                  className={`px-4 pb-4 text-[10px] md:text-xs text-[#848e9c] leading-relaxed transition-all duration-200 ${
                    openFaq === idx ? "block" : "hidden"
                  }`}
                >
                  {faq.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
