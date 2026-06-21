import Image from "next/image";

type CoinAvatarProps = {
  src: string;
  symbol: string;
  size?: number;
};

export function CoinAvatar({ src, symbol, size = 28 }: CoinAvatarProps) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-white/5"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${symbol} logo`}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}
