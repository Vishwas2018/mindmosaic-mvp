"use client";

import { type CSSProperties } from "react";

type MindMosaicLogoProps = {
  className?: string;
  style?: CSSProperties;
  title?: string;
  variant?: "full" | "mark";
};

export function MindMosaicLogo({
  className,
  style,
  title = "MindMosaic",
  variant = "full",
}: MindMosaicLogoProps) {
  const src = variant === "mark" ? "/mindmosaic-mark.svg" : "/mindmosaic-logo.svg";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      className={className}
      style={style}
      draggable={false}
    />
  );
}
