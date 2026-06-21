import Image from "next/image";
import Link from "next/link";

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

  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
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
