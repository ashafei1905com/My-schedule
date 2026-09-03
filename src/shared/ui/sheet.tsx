import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;

export function SheetContent({
  className,
  children,
  title,
  side = "right",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  title?: ReactNode;
  side?: "right" | "left" | "bottom";
}) {
  const pos =
    side === "bottom"
      ? "inset-x-0 bottom-0 max-h-[88vh] rounded-t-xl"
      : side === "left"
        ? "inset-y-0 left-0 h-full w-[min(100vw,380px)] rounded-r-xl"
        : "inset-y-0 right-0 h-full w-[min(100vw,380px)] rounded-l-xl";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-bg/70" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 overflow-y-auto border border-border bg-surface p-5 shadow-panel",
          pos,
          className,
        )}
        {...props}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <DialogPrimitive.Title className="text-base font-semibold text-fg">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
