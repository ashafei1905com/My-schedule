import { cn } from "@/shared/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "success" | "warn" | "accent" | "danger" }) {
  const tones = {
    muted: "bg-surface-2 text-fg-muted border-border",
    success: "bg-success/15 text-success border-success/30",
    warn: "bg-warn/15 text-warn border-warn/30",
    accent: "bg-accent/15 text-accent border-accent/30",
    danger: "bg-danger/15 text-danger border-danger/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
