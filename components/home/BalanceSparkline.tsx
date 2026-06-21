"use client";

type BalanceSparklineProps = {
  data: number[];
  positive: boolean;
};

export function BalanceSparkline({ data, positive }: BalanceSparklineProps) {
  if (data.length < 2) {
    return <div className="mt-4 h-[72px] w-full rounded-lg bg-white/[0.02]" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 320;
  const height = 72;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - 8 - ((value - min) / range) * (height - 16);
      return `${x},${y}`;
    })
    .join(" ");

  const stroke = positive ? "#22c55e" : "#f87171";
  const fillId = positive ? "balanceFillUp" : "balanceFillDown";

  return (
    <div className="relative mt-4 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[72px] w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${fillId})`} points={`0,${height} ${points} ${width},${height}`} />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#161a1e] to-transparent"
        aria-hidden
      />
    </div>
  );
}
