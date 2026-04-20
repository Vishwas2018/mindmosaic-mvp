import { type ElementType, type HTMLAttributes, type ReactNode } from "react";

export type CardVariant = "default" | "hover";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?:  CardVariant;
  as?:       ElementType;
  children:  ReactNode;
}

export function Card({
  variant   = "default",
  as:       Tag = "div",
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <Tag
      {...props}
      className={[
        "card",
        variant === "hover" ? "card-interactive" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}
