// src/components/home/bazaar/bazaarPalette.ts
// One place for the market colours. Every bazaar component takes its colours
// from here through CSS variables (--c, --c-soft, --c-on), so changing a
// swatch changes the whole page.
import type { CSSProperties } from "react";

export type Swatch = {
  /** saturated colour: awnings, tiles, stickers */
  main: string;
  /** light tint of the same colour: section backgrounds */
  soft: string;
  /** readable text colour on top of `main` */
  on: string;
};

export const INK = "#1c1240"; // deep indigo: signboards, text anchors

export const SWATCHES: Swatch[] = [
  { main: "#e63b2e", soft: "#ffe3de", on: "#ffffff" }, // 0 tomato
  { main: "#ffb400", soft: "#fff1c2", on: INK }, //       1 marigold
  { main: "#1f9d55", soft: "#d9f3e3", on: "#ffffff" }, // 2 leaf
  { main: "#e6317d", soft: "#ffddeb", on: "#ffffff" }, // 3 magenta
  { main: "#0f7c8f", soft: "#d5f0f4", on: "#ffffff" }, // 4 peacock
];

export type BazaarVars = CSSProperties & Record<`--${string}`, string>;

export function swatchVars(i: number): BazaarVars {
  const s =
    SWATCHES[((i % SWATCHES.length) + SWATCHES.length) % SWATCHES.length];
  return { "--c": s.main, "--c-soft": s.soft, "--c-on": s.on };
}
