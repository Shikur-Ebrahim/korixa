import Link from "next/link";
import { type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = {
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-background hover:bg-primary/90 shadow-[0_4px_14px_rgba(247,147,26,0.25)] hover:shadow-[0_6px_20px_rgba(247,147,26,0.35)]",
  secondary:
    "bg-secondary text-background hover:bg-secondary/90 shadow-[0_4px_14px_rgba(34,197,94,0.2)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.3)]",
  ghost:
    "bg-transparent text-foreground hover:bg-white/5 border border-transparent hover:border-border",
  outline:
    "bg-transparent text-foreground border border-border hover:border-primary/40 hover:bg-white/5",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]";

export function Button({
  href = "#",
  variant = "primary",
  children,
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const classes = `${baseStyles} ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
