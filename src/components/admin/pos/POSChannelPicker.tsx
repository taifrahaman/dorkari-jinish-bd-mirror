// src/components/admin/pos/POSChannelPicker.tsx

"use client";

import { MessageCircle, Phone, Store, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { POSChannel } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSChannelPickerProps = {
  value: POSChannel;
  onChange: (next: POSChannel) => void;
  disabled?: boolean;
  className?: string;
};

/* ============================================================
 * Options
 * ============================================================ */

const OPTIONS: Array<{
  value: POSChannel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    value: "walk-in",
    label: "Walk-in",
    icon: Store,
    description: "Customer is at the shop",
  },
  {
    value: "phone",
    label: "Phone",
    icon: Phone,
    description: "Ordered by phone call",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: MessageCircle,
    description: "Facebook Messenger order",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageSquare,
    description: "WhatsApp message order",
  },
];

/* ============================================================
 * Component
 * ============================================================ */

export function POSChannelPicker({
  value,
  onChange,
  disabled = false,
  className,
}: POSChannelPickerProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-medium text-brand-text-secondary">
        Where did this order come from?
      </p>

      <div className="grid grid-cols-4 gap-1">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => !disabled && onChange(opt.value)}
              disabled={disabled}
              title={opt.description}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-1 rounded-md border px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-primary/40 hover:text-brand-primary",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default POSChannelPicker;
