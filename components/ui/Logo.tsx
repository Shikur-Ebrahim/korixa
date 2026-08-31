"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
  adminTapCount?: number;
};

const sizeMap = {
  sm: { image: 28, text: "text-sm" },
  md: { image: 36, text: "text-base" },
  lg: { image: 48, text: "text-lg" },
};

export function Logo({ size = "md", showName = true, className = "", adminTapCount = 0 }: LogoProps) {
  const { image, text } = sizeMap[size];
  const router = useRouter();
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (e: React.MouseEvent) => {
    if (adminTapCount === 0) return;

    tapCount.current += 1;
    
    if (tapTimer.current) clearTimeout(tapTimer.current);
    
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0;
    }, 5000); // 5 seconds to easily allow 15 taps

    if (tapCount.current >= adminTapCount) {
      e.preventDefault();
      tapCount.current = 0;
      if (tapTimer.current) clearTimeout(tapTimer.current);
      router.push("/admin-login");
    }
  };

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-2.5 select-none ${className}`} 
      onClick={handleTap}
      style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
    >
      <Image
        src="/app logo.jpg"
        alt="Korixa logo"
        width={image}
        height={image}
        className="rounded-lg object-cover pointer-events-none"
        priority
      />
      {showName && (
        <span className={`font-semibold tracking-tight text-foreground pointer-events-none ${text}`}>
          Korixa
        </span>
      )}
    </Link>
  );
}
