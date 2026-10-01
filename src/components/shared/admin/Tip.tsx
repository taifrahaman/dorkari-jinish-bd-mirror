// src/components/shared/admin/Tip.tsx

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tip({
  show,
  children,
}: {
  show: boolean;
  children: ReactNode;
}) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-brand-primary-dark px-2 py-1 text-xs text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150",
        show && "group-hover:opacity-100",
      )}
    >
      {children}
    </span>
  );
}
