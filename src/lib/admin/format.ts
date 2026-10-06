// src/lib/admin/format.ts

/* ============================================================
 * Currency
 * ============================================================ */

const BDT = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const BDT_PRECISE = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a number as BDT currency. Drops decimals by default
 * since product prices in this store are whole numbers.
 */
export function formatPrice(
  value: number | null | undefined,
  options: { precise?: boolean } = {},
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return options.precise ? BDT_PRECISE.format(value) : BDT.format(value);
}

/* ============================================================
 * Numbers
 * ============================================================ */

const NUMBER = new Intl.NumberFormat("en-US");

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return NUMBER.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/* ============================================================
 * Dates
 * ============================================================ */

const DATE_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_LONG = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_SHORT.format(d);
}

export function formatDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return DATE_LONG.format(d);
}

/**
 * "3 minutes ago", "2 days ago", "in 5 minutes".
 * Falls back to a plain date after 30 days.
 */
export function formatRelative(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 30) return "just now";
  if (absSec < 60 * 60)
    return RELATIVE.format(Math.round(diffSec / 60), "minute");
  if (absSec < 60 * 60 * 24)
    return RELATIVE.format(Math.round(diffSec / (60 * 60)), "hour");
  if (absSec < 60 * 60 * 24 * 30)
    return RELATIVE.format(Math.round(diffSec / (60 * 60 * 24)), "day");

  return formatDate(d);
}

/* ============================================================
 * Text
 * ============================================================ */

/**
 * Truncate long text with an ellipsis. Uses code-unit safe
 * slicing — good enough for the admin's short strings.
 */
export function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

/**
 * Extract initials for avatars / product thumbnails fallback.
 * "Cotton Panjabi" → "CP"
 */
export function initials(value: string | null | undefined, max = 2): string {
  if (!value) return "?";
  const words = value.trim().split(/\s+/).filter(Boolean).slice(0, max);
  if (words.length === 0) return "?";
  return words.map((w) => w[0]!.toUpperCase()).join("");
}

/* ============================================================
 * Stock helpers (used by badges)
 * ============================================================ */

export type StockLevel = "out" | "low" | "in";

export function stockLevel(stock: number, threshold = 5): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "in";
}

/* ============================================================
 * File sizes
 * ============================================================ */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1,
  );
  return `${(bytes / k ** i).toFixed(decimals)} ${sizes[i]}`;
}
