"use client";

import { motion } from "framer-motion";

const cards = [
  {
    text: "Trade Completed",
    position: "absolute -left-2 top-8 sm:-left-8 sm:top-12",
    color: "border-secondary/30 bg-secondary/10 text-secondary",
    delay: 0,
  },
  {
    text: "Payment Received",
    position: "absolute -right-2 top-1/3 sm:-right-10",
    color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    delay: 0.5,
  },
  {
    text: "Funds Released",
    position: "absolute -left-4 bottom-16 sm:-left-10 sm:bottom-20",
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    delay: 1,
  },
];

export function FloatingTransactionCards() {
  return (
    <>
      {cards.map((card) => (
        <motion.div
          key={card.text}
          className={`${card.position} z-20 rounded-xl border px-2.5 py-2 shadow-lg backdrop-blur-md sm:px-3 sm:py-2.5 ${card.color}`}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: card.delay },
            opacity: { duration: 0.5, delay: card.delay },
            scale: { duration: 0.5, delay: card.delay },
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            <span className="whitespace-nowrap text-[10px] font-medium sm:text-xs">{card.text}</span>
          </div>
        </motion.div>
      ))}
    </>
  );
}
