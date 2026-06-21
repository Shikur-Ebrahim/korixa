"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CardCarousel } from "@/components/landing/virtual-card/CardCarousel";

const features = [
  "Instant Card Creation",
  "Online Payments",
  "International Transactions",
  "Advanced Security",
  "Real-Time Management",
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

export function VirtualCardSection() {
  return (
    <section
      id="virtual-card"
      className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-16 bottom-1/4 h-72 w-72 rounded-full bg-purple-600/15 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 sm:mb-12"
        >
          <CardCarousel />
        </motion.div>

        <div className="mx-auto max-w-xl text-center">
          <motion.span
            className="mb-4 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-300 sm:text-xs"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            transition={fadeTransition(0)}
          >
            Virtual USD Card
          </motion.span>

          <motion.h2
            className="mb-3 text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            transition={fadeTransition(0.08)}
          >
            Spend Globally With Your Digital Card
          </motion.h2>

          <motion.p
            className="mb-6 text-sm leading-relaxed text-muted sm:text-base"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            transition={fadeTransition(0.16)}
          >
            Create a virtual card instantly for online purchases, subscriptions,
            international payments, and secure transactions.
          </motion.p>

          <motion.ul
            className="mb-8 inline-flex flex-col items-start gap-2.5 text-left sm:mx-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            transition={fadeTransition(0.24)}
          >
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </motion.ul>

          <motion.div
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            transition={fadeTransition(0.32)}
          >
            <Button href="/sign-up" variant="primary" fullWidth className="sm:w-auto sm:px-6">
              Get Your Card
            </Button>
            <Button href="#virtual-card" variant="outline" fullWidth className="sm:w-auto sm:px-6">
              Learn More
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
