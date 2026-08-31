import Link from "next/link";
import { type ReactNode, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-background hover:bg-primary/90 shadow-[0_4px_14px_rgba(247,147,26,0.25)] hover:shadow-[0_6px_20px_rgba(247,147,26,0.35)] disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "bg-secondary text-background hover:bg-secondary/90 shadow-[0_4px_14px_rgba(34,197,94,0.2)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "bg-transparent text-foreground hover:bg-white/5 border border-transparent hover:border-border disabled:opacity-50 disabled:pointer-events-none",
  outline:
    "bg-transparent text-foreground border border-border hover:border-primary/40 hover:bg-white/5 disabled:opacity-50 disabled:pointer-events-none",
};

const baseStyles =
  "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]";

export function Button({
  href,
  variant = "primary",
  children,
  className = "",
  fullWidth = false,
  ...props
}: ButtonProps) {
  const classes = `${baseStyles} ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
