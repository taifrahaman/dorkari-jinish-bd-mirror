// src/components/admin/color/ColorImagePickerModal.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColorPicker } from "@/lib/admin/use-color-picker";

/* ============================================================
 * Types
 * ============================================================ */

export type ColorImagePickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrls: string[];
  onPick: (hex: string) => void;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ColorImagePickerModal({
  open,
  onOpenChange,
  imageUrls,
  onPick,
}: ColorImagePickerModalProps) {
  const picker = useColorPicker();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentHex, setCurrentHex] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeUrl = imageUrls[activeIndex];

  /* ----------------------------------------------------------
   * Load current image into canvas
   * ---------------------------------------------------------- */

  useEffect(() => {
    if (!open || !activeUrl) return;
    setLoadError(null);
    setLoading(true);

    picker
      .loadImageToCanvas(activeUrl)
      .then((canvas) => {
        canvasRef.current = canvas;
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "Failed to load image — it may be blocked by CORS.",
        );
      })
      .finally(() => setLoading(false));
  }, [open, activeUrl, picker]);

  /* ----------------------------------------------------------
   * Reset on close
   * ---------------------------------------------------------- */

  useEffect(() => {
    if (!open) {
      setCurrentHex(null);
      setCursorPos(null);
      setLoadError(null);
    }
  }, [open]);

  /* ----------------------------------------------------------
   * Pointer handlers
   * ---------------------------------------------------------- */

  const sampleAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setCursorPos({ x, y });

    const hex = picker.pickFromCanvas(canvas, x, y);
    if (hex) setCurrentHex(hex);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    sampleAt(e.clientX, e.clientY);
  };

  const onPointerLeave = () => {
    setCursorPos(null);
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentHex) onPick(currentHex);
  };

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-brand-primary">
            Pick a color from an image
          </DialogTitle>
          <DialogDescription className="text-sm text-brand-text-secondary">
            Move your cursor over the image to preview the color. Click to
            select.
          </DialogDescription>
        </DialogHeader>

        {imageUrls.length === 0 ? (
          <div className="rounded-md border border-dashed border-brand-border px-4 py-10 text-center text-sm text-brand-text-secondary">
            No images available to sample from. Upload a product image first.
          </div>
        ) : (
          <>
            {/* Image selector */}
            {imageUrls.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "h-12 w-12 overflow-hidden rounded-md border-2 transition-colors",
                      i === activeIndex
                        ? "border-brand-accent"
                        : "border-transparent opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Select image ${i + 1}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Image + crosshair */}
            <div
              ref={containerRef}
              onPointerMove={onPointerMove}
              onPointerLeave={onPointerLeave}
              onClick={onClick}
              className="relative max-h-100 cursor-crosshair overflow-hidden rounded-md border border-brand-border bg-muted/40"
            >
              {loading && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-background/60">
                  <Loader2
                    className="h-5 w-5 animate-spin text-brand-text-secondary"
                    aria-hidden="true"
                  />
                </div>
              )}

              {loadError && (
                <div className="px-4 py-10 text-center text-sm text-destructive">
                  {loadError}
                </div>
              )}

              {!loadError && activeUrl && (
                <img
                  src={activeUrl}
                  alt="Sample from this image"
                  className="block max-h-100 w-full object-contain"
                  draggable={false}
                />
              )}

              {/* Crosshair */}
              {cursorPos && !loadError && (
                <>
                  <div
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                    style={{ left: cursorPos.x, top: cursorPos.y }}
                  />
                  <div
                    className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40"
                    style={{ left: cursorPos.x, top: cursorPos.y }}
                  />
                </>
              )}
            </div>

            {/* Preview + actions */}
            <div className="flex items-center justify-between gap-3 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-md border border-brand-border"
                  style={{ backgroundColor: currentHex ?? "transparent" }}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-mono text-sm tabular-nums text-brand-primary">
                    {currentHex ?? "—"}
                  </p>
                  <p className="text-[11px] text-brand-text-secondary">
                    {currentHex
                      ? "Click the image again to confirm"
                      : "Hover over the image to sample"}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => currentHex && onPick(currentHex)}
                disabled={!currentHex}
              >
                Use this color
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ColorImagePickerModal;
