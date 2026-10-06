// src/lib/admin/use-color-picker.ts

"use client";

import { useCallback, useRef, useState } from "react";

/* ============================================================
 * Types
 * ============================================================ */

type EyeDropperResult = { sRGBHex: string };

type EyeDropperConstructor = new () => {
  open(options?: { signal?: AbortSignal }): Promise<EyeDropperResult>;
};

declare global {
  interface Window {
    EyeDropper?: EyeDropperConstructor;
  }
}

export type UseColorPickerReturn = {
  /** True if the native EyeDropper API is available. */
  isNativeSupported: boolean;
  /** Opens the OS-level eyedropper. Returns hex or null if cancelled/unsupported. */
  pickNative: () => Promise<string | null>;
  /** Samples a pixel from a canvas at (x, y) in CSS pixels. */
  pickFromCanvas: (
    canvas: HTMLCanvasElement,
    x: number,
    y: number,
  ) => string | null;
  /** Loads an image URL and returns a canvas ready for pixel sampling. */
  loadImageToCanvas: (src: string) => Promise<HTMLCanvasElement>;
  /** Current error state, if any. */
  error: string | null;
};

/* ============================================================
 * Hook
 * ============================================================ */

export function useColorPicker(): UseColorPickerReturn {
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isNativeSupported =
    typeof window !== "undefined" && typeof window.EyeDropper === "function";

  /* ----------------------------------------------------------
   * Native eyedropper
   * ---------------------------------------------------------- */

  const pickNative = useCallback(async (): Promise<string | null> => {
    if (!isNativeSupported) return null;

    try {
      const EyeDropper = window.EyeDropper!;
      const dropper = new EyeDropper();
      const result = await dropper.open();
      setError(null);
      return result.sRGBHex.toLowerCase();
    } catch (err) {
      // User cancelled — not really an error
      if (err instanceof DOMException && err.name === "AbortError") {
        return null;
      }
      setError("Could not open the eyedropper.");
      return null;
    }
  }, [isNativeSupported]);

  /* ----------------------------------------------------------
   * Canvas helpers
   * ---------------------------------------------------------- */

  const loadImageToCanvas = useCallback(
    async (src: string): Promise<HTMLCanvasElement> => {
      // Reuse existing canvas if it matches the same source
      if (canvasRef.current?.dataset.src === src) {
        return canvasRef.current;
      }

      const img = await loadImage(src);

      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.dataset.src = src;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas 2D not supported");
      ctx.drawImage(img, 0, 0);

      canvasRef.current = canvas;
      return canvas;
    },
    [],
  );

  const pickFromCanvas = useCallback(
    (canvas: HTMLCanvasElement, cssX: number, cssY: number): string | null => {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      // CSS pixels → canvas pixels (images may be scaled in the UI)
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(cssX * scaleX);
      const y = Math.floor(cssY * scaleY);

      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        return null;
      }

      try {
        const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
        return rgbToHex(r, g, b);
      } catch (err) {
        setError(
          "Could not read the image — it may be blocked by CORS. Ensure the image is served with `Access-Control-Allow-Origin`.",
        );
        return null;
      }
    },
    [],
  );

  return {
    isNativeSupported,
    pickNative,
    pickFromCanvas,
    loadImageToCanvas,
    error,
  };
}

/* ============================================================
 * Utils
 * ============================================================ */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
