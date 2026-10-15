// src/lib/admin/pos/use-barcode-scanner.ts

"use client";

import { useEffect, useRef } from "react";

/* ============================================================
 * Barcode scanner support
 *
 * Most POS barcode scanners act as a "keyboard wedge" — they
 * type the barcode digits extremely fast (~1–2ms apart) and end
 * with an Enter. Human typing is far slower (>50ms between keys).
 *
 * Detection:
 *   - Accumulate printable keys into a buffer.
 *   - If more than RESET_GAP_MS elapses between keys, reset the
 *     buffer (a human paused — not a scan).
 *   - On Enter, if the buffer is >= MIN_LENGTH chars, fire onScan.
 *   - stopPropagation() so the Enter doesn't submit a form.
 *
 * Runs on the capture phase so it fires before any input's own
 * keydown handlers.
 * ============================================================ */

const RESET_GAP_MS = 100;
const MIN_LENGTH = 4;

export type UseBarcodeScannerOptions = {
  onScan: (barcode: string) => void;
  enabled?: boolean;
};

export function useBarcodeScanner({
  onScan,
  enabled = true,
}: UseBarcodeScannerOptions): void {
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const now = Date.now();
      const gap = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Human pause → not a scan
      if (gap > RESET_GAP_MS && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      if (e.key === "Enter") {
        const scanned = bufferRef.current.trim();
        bufferRef.current = "";

        if (scanned.length >= MIN_LENGTH) {
          e.preventDefault();
          e.stopPropagation();
          onScanRef.current(scanned);
        }
        return;
      }

      // Only append printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [enabled]);
}
