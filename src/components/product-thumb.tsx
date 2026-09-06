import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductThumb({
  src,
  alt,
  gcode,
  className,
}: {
  src: string | null;
  alt: string;
  gcode: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  const mark = gcode.replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase() || "AM";

  return (
    <div
      className={cn(
        "relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-bg-subtle text-muted",
        className,
      )}
    >
      {show ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-display text-lg tracking-tight">{mark}</span>
      )}
    </div>
  );
}
