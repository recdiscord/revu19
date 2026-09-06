import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/70 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <Dialog.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-xl bg-bg-elevated p-5 shadow-[var(--shadow-border)]",
          "md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:rounded-none md:rounded-l-xl",
          className,
        )}
        {...props}
      >
        <Dialog.Close
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-md text-muted hover:bg-bg-subtle hover:text-fg"
          aria-label="Zamknij"
        >
          <X className="size-4" />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export function SheetTitle({ className, ...props }: ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn("font-display text-xl tracking-tight text-fg", className)}
      {...props}
    />
  );
}
