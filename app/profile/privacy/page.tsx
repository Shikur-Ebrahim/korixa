"use client";

import { useRouter } from "next/navigation";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { appTheme } from "@/components/layout/app-theme";

const SECTIONS = [
  {
    title: "1. Introduction",
    content: `Korixa ("we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, store, and share your information when you use the Korixa platform available at korixapay.com (the "Platform").

By using Korixa, you agree to the collection and use of your information in accordance with this policy. Please read it carefully.`,
  },
  {
    title: "2. Information We Collect",
    content: `We collect several types of information to provide and improve our services:

• Identity Information: Full name, date of birth, government-issued ID documents (national ID, passport, driver's license), and selfie photographs collected during identity verification (KYC).

• Account Information: Email address, password (encrypted), account creation date, and login history.

• Transaction Data: Records of all P2P trades, orders, deposit and withdrawal requests, payment method details, and amounts.

• Device & Usage Data: IP address, browser type, device identifiers, pages visited, and access timestamps.

• Communications: Any messages sent to our support team or through the platform.`,
  },
  {
    title: "3. How We Use Your Information",
    content: `We use the information we collect for the following purposes:

• Identity Verification (KYC/AML): To verify your identity as required by financial regulations, prevent fraud, and comply with anti-money laundering laws.

• Service Delivery: To process trades, orders, deposits, and withdrawals on your behalf.

• Security: To detect suspicious activity, protect against fraud, and keep your account secure.

• Communication: To send you important account notifications, trade updates, and security alerts.

• Compliance: To meet our legal obligations under applicable financial regulations and government requests.

• Improvement: To analyze usage patterns and improve the platform's features and user experience.`,
  },
  {
    title: "4. How We Store & Protect Your Data",
    content: `Your data is stored on secure, encrypted servers. We use industry-standard security measures including:

• AES-256 encryption for data at rest
• TLS 1.3 encryption for all data in transit
• Strict access controls — only authorized personnel can access your data
• Regular security audits and penetration testing

KYC documents (ID images, selfie photos) are stored in a secure cloud environment and are only accessible by authorized compliance staff.`,
  },
  {
    title: "5. Sharing Your Information",
    content: `We do not sell your personal information to third parties. We may share your data in the following limited circumstances:

• Regulatory Compliance: With government authorities, law enforcement agencies, or financial regulators when legally required to do so.

• KYC Providers: With identity verification service providers who assist us in verifying your identity.

• Service Providers: With trusted third-party vendors who help us operate the platform (e.g., cloud hosting, analytics), bound by strict data protection agreements.

• Business Transfer: In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new entity.`,
  },
  {
    title: "6. Your Rights",
    content: `Depending on your location, you may have the following rights regarding your personal data:

• Right of Access: Request a copy of the personal data we hold about you.

• Right to Correction: Request that we correct inaccurate or incomplete data.

• Right to Deletion: Request deletion of your personal data, subject to legal retention requirements (e.g., KYC records must be retained for a minimum period by law).

• Right to Portability: Request your data in a portable, machine-readable format.

• Right to Object: Object to certain types of data processing.

To exercise any of these rights, please contact us at Korixasupport@gmail.com.`,
  },
  {
    title: "7. Cookies & Tracking",
    content: `We use cookies and similar tracking technologies to:

• Keep you logged in to your account
• Remember your preferences
• Analyze platform usage and performance

You can control cookie settings through your browser. Disabling cookies may affect some platform functionality.`,
  },
  {
    title: "8. Data Retention",
    content: `We retain your personal data for as long as your account is active or as needed to provide our services. KYC and transaction records are retained for a minimum of 5 years as required by financial regulations, even after account closure.`,
  },
  {
    title: "9. Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a prominent notice on the platform. The "Last Updated" date at the top of this page indicates when the policy was last revised.

Continued use of the platform after changes are posted constitutes your acceptance of the updated policy.`,
  },
  {
    title: "10. Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection team:

Email: Korixasupport@gmail.com
Platform: Use the Support & FAQ section in your profile menu.

We aim to respond to all privacy inquiries within 5 business days.`,
  },
];

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className={appTheme.page}>
      {/* Header */}
      <div className={appTheme.header}>
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <button
            onClick={() => router.push("/dashboard?profile=open")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-white/[0.06] transition"
          >
            <FiArrowLeft size={20} className="text-[#848e9c]" />
          </button>
          <h1 className="ml-2 text-sm md:text-base font-bold text-white">Privacy Policy</h1>
        </div>
      </div>

      <main className={appTheme.main}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#161a1e] via-[#0f1923] to-[#0b0e11] p-5 mb-6 text-center">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 ring-2 ring-blue-500/25">
              <FiShield className="text-blue-400" size={22} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Privacy Policy</h1>
            <p className="text-[10px] md:text-xs text-[#848e9c]">Last updated: June 2025</p>
            <p className="text-[10px] md:text-xs text-[#848e9c] mt-2 max-w-xs mx-auto leading-relaxed">
              Your privacy matters. This policy explains how Korixa collects, uses, and protects your personal data.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-4">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-xl md:rounded-2xl border border-white/[0.06] bg-[#161a1e] p-5"
            >
              <h2 className="text-xs md:text-sm font-bold text-white mb-3 pb-2 border-b border-white/[0.06]">
                {section.title}
              </h2>
              <p className="text-[10px] md:text-xs text-[#848e9c] leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
          <p className="text-[10px] md:text-xs text-[#848e9c] leading-relaxed">
            By using Korixa, you acknowledge that you have read and understood this Privacy Policy.
            <br />
            <span className="text-blue-400 font-semibold">Korixasupport@gmail.com</span>
          </p>
        </div>
      </main>
    </div>
  );
}
