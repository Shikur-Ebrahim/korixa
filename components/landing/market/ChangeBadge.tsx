import { formatPercent } from "@/lib/format";

type ChangeBadgeProps = {
  value: number | null | undefined;
  size?: "sm" | "md";
};

export function ChangeBadge({ value, size = "sm" }: ChangeBadgeProps) {
  const positive = value != null && value >= 0;
  const textSize = size === "md" ? "text-xs" : "text-[11px]";

  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-medium ${textSize} ${
        positive
          ? "bg-secondary/10 text-secondary"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {formatPercent(value)}
    </span>
  );
}
