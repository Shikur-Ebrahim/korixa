import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:p-5 ${
        hover
          ? "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
