// src/components/shared/admin/BrandMark.tsx

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-brand-accent font-heading font-semibold text-brand-primary shadow-sm",
        className,
      )}
    >
      D
    </span>
  );
}
