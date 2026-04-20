import { type ReactNode } from "react";

export interface EmptyStateProps {
  icon?:        ReactNode;
  heading:      string;
  subtext?:     string;
  action?:      ReactNode;
  className?:   string;
}

export function EmptyState({ icon, heading, subtext, action, className = "" }: EmptyStateProps) {
  return (
    <div className={["flex flex-col items-center justify-center text-center py-16 px-6", className].join(" ")}>
      {icon && (
        <div className="mb-4 text-slate-300 [&_svg]:w-12 [&_svg]:h-12">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-1">{heading}</h3>
      {subtext && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-6">{subtext}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
