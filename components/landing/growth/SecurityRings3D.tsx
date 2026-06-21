"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type MouseEvent } from "react";

type RingProps = {
  size: number;
  thickness: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  duration: number;
  glow: string;
  border: string;
};

function Ring({
  size,
  thickness,
  rotateX,
  rotateY,
  rotateZ,
  duration,
  glow,
  border,
}: RingProps) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderWidth: thickness,
        borderStyle: "solid",
        borderColor: border,
        boxShadow: glow,
        transformStyle: "preserve-3d",
      }}
      initial={{ rotateX, rotateY, rotateZ }}
      animate={{
        rotateX: [rotateX, rotateX + 360],
        rotateY: [rotateY, rotateY + 360],
        rotateZ: [rotateZ, rotateZ + 180],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

export function SecurityRings3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [18, -18]), {
    stiffness: 120,
    damping: 20,
  });
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), {
    stiffness: 120,
    damping: 20,
  });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex h-[280px] w-full max-w-md items-center justify-center sm:h-[340px] sm:max-w-lg"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 900 }}
    >
      <motion.div
        className="relative h-64 w-64 sm:h-72 sm:w-72"
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
      >
        <Ring
          size={260}
          thickness={3}
          rotateX={72}
          rotateY={12}
          rotateZ={0}
          duration={22}
          border="rgba(148, 163, 184, 0.45)"
          glow="0 0 30px rgba(247, 147, 26, 0.15), inset 0 0 24px rgba(247, 147, 26, 0.08)"
        />
        <Ring
          size={190}
          thickness={5}
          rotateX={20}
          rotateY={68}
          rotateZ={30}
          duration={16}
          border="rgba(226, 232, 240, 0.55)"
          glow="0 0 40px rgba(34, 211, 238, 0.12), inset 0 0 20px rgba(247, 147, 26, 0.2)"
        />
        <Ring
          size={120}
          thickness={2}
          rotateX={55}
          rotateY={-40}
          rotateZ={-15}
          duration={12}
          border="rgba(247, 147, 26, 0.5)"
          glow="0 0 35px rgba(247, 147, 26, 0.35), inset 0 0 16px rgba(34, 197, 94, 0.1)"
        />

        <motion.div
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_rgba(247,147,26,0.6)]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-primary/5 via-transparent to-cyan-500/5 blur-2xl" />
    </div>
  );
}
