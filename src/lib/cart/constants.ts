// src/lib/cart/constants.ts

export const PROMO_CODES: Record<
  string,
  { type: "percent" | "shipping"; value?: number }
> = {
  SAVE10: { type: "percent", value: 10 },
  FREESHIP: { type: "shipping" },
};
