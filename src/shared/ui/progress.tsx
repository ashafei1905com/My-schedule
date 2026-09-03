import { cn } from "@/shared/lib/cn";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-border", className)}>
      <div
        className={cn("h-full rounded-full bg-accent transition-[width] duration-300", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
