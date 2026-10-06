// src/components/admin/color/ColorEyedropperButton.tsx

"use client";

import { useState } from "react";
import { Loader2, Pipette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColorPicker } from "@/lib/admin/use-color-picker";
import { ColorImagePickerModal } from "./ColorImagePickerModal";

/* ============================================================
 * Types
 * ============================================================ */

export type ColorEyedropperButtonProps = {
  /** Called with a hex like "#c0c0c0" when a color is picked. */
  onPick: (hex: string) => void;
  /** Product images the modal can sample from (URLs). */
  imageUrls?: string[];
  disabled?: boolean;
  className?: string;
  /** Render as icon-only. Default: false. */
  compact?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ColorEyedropperButton({
  onPick,
  imageUrls = [],
  disabled = false,
  className,
  compact = false,
}: ColorEyedropperButtonProps) {
  const picker = useColorPicker();
  const [modalOpen, setModalOpen] = useState(false);
  const [working, setWorking] = useState(false);

  const handleClick = async () => {
    // Try native first (Chrome/Edge 95+)
    if (picker.isNativeSupported) {
      setWorking(true);
      const hex = await picker.pickNative();
      setWorking(false);
      if (hex) {
        onPick(hex);
        return;
      }
      // If user cancelled, fall through silently — don't open the modal
      // unless they explicitly click again.
      return;
    }

    // Fallback — open the modal
    setModalOpen(true);
  };

  const handleModalPick = (hex: string) => {
    onPick(hex);
    setModalOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "icon" : "sm"}
        onClick={handleClick}
        disabled={disabled || working}
        className={cn(compact && "h-9 w-9", className)}
        aria-label="Pick color from screen or image"
        title={
          picker.isNativeSupported
            ? "Pick from anywhere on screen"
            : "Pick from a product image"
        }
      >
        {working ? (
          <Loader2
            className={cn("h-4 w-4 animate-spin", !compact && "mr-2")}
            aria-hidden="true"
          />
        ) : (
          <Pipette
            className={cn("h-4 w-4", !compact && "mr-2")}
            aria-hidden="true"
          />
        )}
        {!compact && "Pick color"}
      </Button>

      {!picker.isNativeSupported && (
        <ColorImagePickerModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          imageUrls={imageUrls}
          onPick={handleModalPick}
        />
      )}
    </>
  );
}

export default ColorEyedropperButton;
