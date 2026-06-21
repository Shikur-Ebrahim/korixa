type SparklineProps = {
  data: number[];
  positive: boolean;
  className?: string;
};

export function Sparkline({ data, positive, className = "" }: SparklineProps) {
  if (data.length < 2) {
    return <div className={`h-8 w-16 ${className}`} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 32;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-8 w-16 shrink-0 ${className}`}
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={positive ? "#22C55E" : "#F87171"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
