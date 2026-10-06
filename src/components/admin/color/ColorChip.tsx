// src/components/admin/color/ColorChip.tsx

"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type ColorChipProps = {
  hex: string;
  /** Display label. Falls back to the hex code if absent. */
  label?: string;
  /** Secondary label shown in a lighter tone. */
  sublabel?: string;
  /** When provided, shows a remove button. */
  onRemove?: () => void;
  size?: "sm" | "md";
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ColorChip({
  hex,
  label,
  sublabel,
  onRemove,
  size = "md",
  className,
}: ColorChipProps) {
  const isSmall = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-surface pr-1.5",
        isSmall ? "h-6 pl-1 text-[11px]" : "h-7 pl-1.5 text-xs",
        className,
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-full border border-black/10",
          isSmall ? "h-3.5 w-3.5" : "h-4 w-4",
        )}
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />

      <span className="flex min-w-0 items-baseline gap-1">
        {label ? (
          <>
            <span className="truncate font-medium text-brand-primary">
              {label}
            </span>
            {sublabel && (
              <span className="truncate text-brand-text-secondary">
                {sublabel}
              </span>
            )}
          </>
        ) : (
          <span className="truncate font-mono tabular-nums text-brand-text-secondary">
            {hex}
          </span>
        )}
      </span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-muted hover:text-destructive"
          aria-label={`Remove ${label ?? hex}`}
        >
          <X className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export default ColorChip;
