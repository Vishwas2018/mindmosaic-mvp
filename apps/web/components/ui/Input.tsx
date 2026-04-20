import { type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label:     string;
  icon?:     ReactNode;
  error?:    string;
  hint?:     string;
}

export function Input({
  label,
  icon,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="input-group">
      <input
        {...props}
        id={inputId}
        placeholder=" "
        className={[
          error ? "error-field" : "",
          className,
        ].filter(Boolean).join(" ")}
      />
      <label className="floating-label" htmlFor={inputId}>{label}</label>
      {icon && <span className="input-icon">{icon}</span>}
      {error && <div className="field-hint error" role="alert">{error}</div>}
      {hint && !error && <div className="field-hint">{hint}</div>}
    </div>
  );
}
