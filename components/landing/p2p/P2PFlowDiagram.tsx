"use client";

import { motion } from "framer-motion";

const steps = [
  {
    label: "Buyer",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  {
    label: "Escrow Protection",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
  {
    label: "Seller",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 0v-.75A.75.75 0 003 15h-.375M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    color: "text-secondary",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
    bg: "bg-secondary/10 border-secondary/30",
  },
];

function AnimatedArrow() {
  return (
    <motion.div
      className="flex flex-1 items-center justify-center px-1 sm:px-2"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <div className="relative flex w-full items-center">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/20" />
        <motion.svg
          className="h-3 w-3 shrink-0 text-primary sm:h-4 sm:w-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </motion.svg>
      </div>
    </motion.div>
  );
}

export function P2PFlowDiagram() {
  return (
    <motion.div
      className="mt-6 flex w-full items-center justify-center"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      {steps.map((step, index) => (
        <div key={step.label} className="flex flex-1 items-center">
          <motion.div
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 backdrop-blur-sm sm:px-3 sm:py-3 ${step.bg} ${step.glow}`}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4, ease: "easeInOut" }}
          >
            <span className={`${step.color}`}>{step.icon}</span>
            <span className="whitespace-nowrap text-[9px] font-medium sm:text-[10px]">{step.label}</span>
          </motion.div>
          {index < steps.length - 1 && <AnimatedArrow />}
        </div>
      ))}
    </motion.div>
  );
}
