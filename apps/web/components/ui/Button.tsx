import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "default" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:   "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed shadow-sm",
  secondary: "bg-white text-brand-500 border border-brand-100 hover:bg-brand-50 hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:     "bg-transparent text-slate-600 hover:bg-slate-75 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:    "bg-soft-600 text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed",
};

const SIZE: Record<ButtonSize, string> = {
  sm:      "px-3 py-1.5 text-sm gap-1.5 rounded-button",
  default: "px-4 py-2.5 text-sm gap-2 rounded-button",
  lg:      "px-5 py-3 text-base gap-2 rounded-button",
};

export function Button({
  variant  = "primary",
  size     = "default",
  loading  = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        "inline-flex items-center justify-center font-medium transition-all duration-fast",
        VARIANT[variant],
        SIZE[size],
        className,
      ].join(" ")}
    >
      {loading && (
        <svg
          className="animate-spin shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      )}
      {children}
    </button>
  );
}
