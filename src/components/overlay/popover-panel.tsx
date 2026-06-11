import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Unified popover layer. Wraps any trigger with a consistently styled panel,
 * optional title/description header, and shared animation.
 */
export function PopoverPanel({
  trigger,
  children,
  title,
  description,
  align = "center",
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  title?: string;
  description?: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-72 rounded-xl border-border/70 bg-popover/95 backdrop-blur-xl",
          className,
        )}
      >
        {(title || description) && (
          <div className="mb-3 space-y-1">
            {title && <p className="font-display text-sm font-semibold">{title}</p>}
            {description && (
              <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </PopoverContent>
    </Popover>
  );
}
