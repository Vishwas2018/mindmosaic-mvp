export type SkeletonRounded = "sm" | "md" | "lg" | "full";

export interface SkeletonProps {
  width?:     string | number;
  height?:    string | number;
  rounded?:   SkeletonRounded;
  lines?:     number;
  className?: string;
}

const ROUNDED: Record<SkeletonRounded, string> = {
  sm:   "rounded",
  md:   "rounded-lg",
  lg:   "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({
  width,
  height  = "1rem",
  rounded = "md",
  lines,
  className = "",
}: SkeletonProps) {
  const style = {
    width:  width  !== undefined ? (typeof width  === "number" ? `${width}px`  : width)  : "100%",
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : "1rem",
  };

  if (lines && lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={["skeleton", ROUNDED[rounded], className].join(" ")}
            style={i === lines - 1 ? { ...style, width: "66%" } : style}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <span
      className={["skeleton block", ROUNDED[rounded], className].join(" ")}
      style={style}
      aria-hidden="true"
    />
  );
}
