"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { image: 28, text: "text-sm" },
  md: { image: 36, text: "text-base" },
  lg: { image: 48, text: "text-lg" },
};

export function Logo({ size = "md", showName = true, className = "" }: LogoProps) {
  const { image, text } = sizeMap[size];
  const router = useRouter();
  const tapCount = useRef(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    tapCount.current += 1;
    
    if (tapTimer.current) clearTimeout(tapTimer.current);
    
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      router.push("/admin/login");
    } else {
      tapTimer.current = setTimeout(() => {
        if (tapCount.current === 1) {
          if (window.location.pathname !== "/") {
            router.push("/");
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
        tapCount.current = 0;
      }, 350); // wait 350ms to see if they tap again
    }
  };

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} onClick={handleTap}>
      <Image
        src="/app logo.jpg"
        alt="Korixa logo"
        width={image}
        height={image}
        className="rounded-lg object-cover"
        priority
      />
      {showName && (
        <span className={`font-semibold tracking-tight text-foreground ${text}`}>
          Korixa
        </span>
      )}
    </Link>
  );
}
