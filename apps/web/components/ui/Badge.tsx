import { type ReactNode } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

export interface BadgeProps {
  variant?:   BadgeVariant;
  children:   ReactNode;
  className?: string;
}

const VARIANT: Record<BadgeVariant, string> = {
  default: "bg-slate-75 text-slate-600",
  success: "bg-good-50 text-good-700 border border-good-100",
  warning: "bg-grow-50 text-grow-700 border border-grow-100",
  danger:  "bg-soft-50 text-soft-600 border border-soft-100",
  info:    "bg-brand-50 text-brand-600 border border-brand-100",
  purple:  "bg-brand-100 text-brand-700",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={["pill", VARIANT[variant], className].join(" ")}>
      {children}
    </span>
  );
}
