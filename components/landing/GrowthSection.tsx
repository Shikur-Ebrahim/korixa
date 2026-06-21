"use client";

import { motion } from "framer-motion";
import { SecurityRings3D } from "@/components/landing/growth/SecurityRings3D";

export function GrowthSection() {
  return (
    <section
      id="growth"
      className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(247,147,26,0.04)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          className="mb-10 text-xl font-medium tracking-tight text-foreground sm:mb-14 sm:text-2xl md:text-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          You&apos;re safe to grow with us
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        >
          <SecurityRings3D />
        </motion.div>
      </div>
    </section>
  );
}
