import { MoreHorizontal, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  separatorBefore?: boolean;
};

/**
 * Unified dropdown action menu. Collapses row / card actions into a single
 * "•••" trigger with consistent styling across the app.
 */
export function ActionMenu({
  items,
  label,
  align = "end",
  trigger,
  className,
}: {
  items: ActionMenuItem[];
  label?: string;
  align?: "start" | "center" | "end";
  trigger?: ReactNode;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" aria-label="更多操作" className={className}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 rounded-xl">
        {label && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              {(item.separatorBefore || (label && i === 0)) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  "cursor-pointer gap-2.5",
                  item.tone === "danger" &&
                    "text-danger focus:bg-danger/10 focus:text-danger",
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
