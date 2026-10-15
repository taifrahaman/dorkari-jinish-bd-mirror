// src/lib/admin/phone.ts

/* ============================================================
 * Phone normalization — Bangladesh local format only.
 *
 * Canonical form: 11 digits starting with 0
 *   "01700000000"
 *
 * Handles all common input shapes:
 *   "+880 1700-000000" → "01700000000"
 *   "8801700000000"    → "01700000000"
 *   "01700 000 000"    → "01700000000"
 *   "1700000000"       → "01700000000"
 *   "01700000000"      → "01700000000"
 *
 * Non-BD numbers (US, etc.) are stripped to digits and returned
 * as-is. If they're not 11 digits starting with 0, they won't
 * collide with BD customers — which is fine for a BD-only shop.
 * ============================================================ */

const BD_MOBILE_LENGTH = 11;

export function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return "";

  // Strip everything except digits
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";

  // "+880 1XXXXXXXXXX" → "8801XXXXXXXXXX" → strip leading 880
  if (digits.startsWith("880") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  }
  // "88 1XXXXXXXXXX" (some people omit a zero)
  else if (digits.startsWith("88") && digits.length >= 12) {
    digits = "0" + digits.slice(2);
  }
  // "1XXXXXXXXX" (10 digits, missing leading zero)
  else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "0" + digits;
  }

  return digits;
}

/**
 * True when the input looks like a valid BD mobile number.
 * Exposed for form validation if we later want to enforce it.
 */
export function isValidBdPhone(raw: string | undefined | null): boolean {
  const n = normalizePhone(raw);
  return n.length === BD_MOBILE_LENGTH && n.startsWith("01");
}

/**
 * Pretty-print for display. Falls back to the raw value for
 * non-standard numbers so we never lose information.
 *
 * "01700000000" → "0170-000000"
 */
export function formatPhoneDisplay(raw: string | undefined | null): string {
  if (!raw) return "";
  const n = normalizePhone(raw);
  if (n.length !== BD_MOBILE_LENGTH || !n.startsWith("01")) {
    return raw;
  }
  return `${n.slice(0, 4)}-${n.slice(4)}`;
}
