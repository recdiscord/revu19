import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md bg-bg-subtle px-3.5 text-base text-fg shadow-[var(--shadow-border)]",
        "placeholder:text-subtle",
        "transition-[box-shadow] duration-[var(--motion-quick)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
