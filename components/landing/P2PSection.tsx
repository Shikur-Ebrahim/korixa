"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { FloatingTransactionCards } from "@/components/landing/p2p/FloatingTransactionCards";
import { P2PFlowDiagram } from "@/components/landing/p2p/P2PFlowDiagram";
import { P2PPhoneMockup } from "@/components/landing/p2p/P2PPhoneMockup";

const features = [
  "Buy USD",
  "Sell USD",
  "Fast Matching",
  "Secure Escrow",
  "Low Fees",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const fadeTransition = (delay: number) => ({
  duration: 0.55,
  delay,
  ease: "easeOut" as const,
});

export function P2PSection() {
  return (
    <section id="p2p" className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -right-24 top-1/3 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -left-20 bottom-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-secondary/5 blur-3xl"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-14">
          <div className="w-full lg:max-w-lg lg:flex-1">
            <motion.span
              className="mb-4 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-300 sm:text-xs"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={fadeTransition(0)}
            >
              P2P Trading
            </motion.span>

            <motion.h2
              className="mb-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={fadeTransition(0.08)}
            >
              Buy and Sell USD Securely
            </motion.h2>

            <motion.p
              className="mb-6 text-sm leading-relaxed text-muted sm:text-base"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={fadeTransition(0.16)}
            >
              Trade directly with other users through our secure peer-to-peer marketplace.
              Fast matching, secure escrow protection, and seamless transactions.
            </motion.p>

            <motion.ul
              className="mb-8 space-y-2.5"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={fadeTransition(0.24)}
            >
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </motion.ul>

            <motion.div
              className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              transition={fadeTransition(0.32)}
            >
              <Button href="/sign-up" variant="primary" fullWidth className="sm:w-auto sm:px-6">
                Start Trading
              </Button>
              <Button href="#p2p" variant="outline" fullWidth className="sm:w-auto sm:px-6">
                View Offers
              </Button>
            </motion.div>
          </div>

          <div className="relative w-full lg:flex-1">
            <FloatingTransactionCards />
            <P2PPhoneMockup />
            <P2PFlowDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}
