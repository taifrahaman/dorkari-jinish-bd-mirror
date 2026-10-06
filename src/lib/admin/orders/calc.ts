// src/lib/admin/orders/calc.ts

/* ============================================================
 * Order calculation helpers
 *
 * These are pure functions — no DB access. Called by the
 * service before insert/update, and by the UI for live preview.
 * ============================================================ */

export type CalcItemInput = {
  quantity: number;
  priceAtTime: number;
  costPriceAtTime: number;
  discount: number;
};

export type CalcResult = {
  lineTotals: number[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  totalAmount: number;
  costTotal: number;
  profitTotal: number;
};

/**
 * Given a list of items and a shipping fee, compute every
 * derived total:
 *   - lineTotal = price × qty − discount (clamped to ≥ 0)
 *   - subtotal  = Σ (price × qty)
 *   - discountTotal = Σ discount
 *   - costTotal = Σ (cost × qty)
 *   - profitTotal = subtotal − discountTotal − costTotal
 *   - totalAmount = subtotal − discountTotal + taxTotal + shippingFee
 *
 * Tax is always 0 in the current build (VAT disabled). When VAT
 * is enabled later, replace the taxTotal line with a per-line
 * computation using a `taxRate` field on each item.
 */
export function calculateOrderTotals(
  items: CalcItemInput[],
  shippingFee: number,
): CalcResult {
  let subtotal = 0;
  let discountTotal = 0;
  let costTotal = 0;
  const lineTotals: number[] = [];

  for (const item of items) {
    const gross = item.priceAtTime * item.quantity;
    const discount = item.discount ?? 0;
    const lineTotal = Math.max(0, gross - discount);

    lineTotals.push(lineTotal);
    subtotal += gross;
    discountTotal += discount;
    costTotal += (item.costPriceAtTime ?? 0) * item.quantity;
  }

  const taxTotal = 0;
  const totalAmount = subtotal - discountTotal + taxTotal + (shippingFee ?? 0);
  const profitTotal = subtotal - discountTotal - costTotal;

  return {
    lineTotals,
    subtotal,
    discountTotal,
    taxTotal,
    shippingFee: shippingFee ?? 0,
    totalAmount,
    costTotal,
    profitTotal,
  };
}

/**
 * Round to two decimal places. Useful for currency display but
 * we generally store full floats — this is only for edge cases.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
