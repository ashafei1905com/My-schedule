import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "max-h-[92dvh] w-full overflow-y-auto border border-border bg-surface-2 shadow-panel",
          "rounded-t-xl p-5 sm:rounded-xl sm:p-6",
          wide ? "sm:max-w-2xl" : "sm:max-w-md",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {sub ? <p className="mt-1 text-sm text-fg-muted">{sub}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-sm text-fg-muted hover:bg-surface hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "quiet";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-primary text-primary-fg hover:opacity-90",
    ghost: "border border-border bg-transparent text-fg hover:bg-surface",
    danger: "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
    quiet: "bg-surface text-fg hover:bg-surface-2",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-opacity disabled:opacity-40",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-fg-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-sm border border-border bg-bg px-3 text-sm text-fg outline-none ring-ring focus:ring-2";
