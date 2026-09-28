// src/lib/cart/constants.ts

export const DELIVERY_FEE = 60;
export const FREE_SHIPPING_THRESHOLD = 3000;

export const PROMO_CODES: Record<
  string,
  { type: "percent" | "shipping"; value?: number }
> = {
  SAVE10: { type: "percent", value: 10 },
  FREESHIP: { type: "shipping" },
};
