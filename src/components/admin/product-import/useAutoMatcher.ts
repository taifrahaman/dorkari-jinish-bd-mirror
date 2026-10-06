// src/components/admin/product-import/useAutoMatcher.ts

"use client";

import { useCallback } from "react";
import type { ParsedCsvRow, StagedImage } from "./useImportStore";

/* ============================================================
 * Types
 * ============================================================ */

export type MatchStrategy =
  | "sku-exact" // filename === sku
  | "sku-prefix" // filename starts with sku
  | "sku-contains" // sku anywhere in filename
  | "slug-match" // filename contains full slug of name.en
  | "name-tokens" // all significant tokens of name.en appear in filename
  | "fuzzy" // Levenshtein distance above threshold
  | "none";

export type MatchAssignment = {
  imageId: string;
  rowIndex: number;
  strategy: MatchStrategy;
  /** 0–1 confidence — higher wins when multiple candidates exist. */
  confidence: number;
};

export type MatchReport = {
  assignments: MatchAssignment[];
  unmatchedImages: StagedImage[];
  unmatchedRows: ParsedCsvRow[];
  /** Human-readable summary for the UI. */
  summary: {
    matched: number;
    unmatchedImages: number;
    unmatchedRows: number;
  };
};

export type RunMatcherOptions = {
  /** Skip images that already have a manual assignment. */
  skipAssigned?: boolean;
  /** When true, don't overwrite existing auto matches either. */
  skipAnyAssigned?: boolean;
};

/* ============================================================
 * Helpers
 * ============================================================ */

/** Lowercase, strip extension, replace non-alphanumerics with spaces. */
function normalizeFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, "") // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, " ") // keep Bangla range
    .trim();
}

/** Convert a filename into tokens. */
function tokenize(value: string): string[] {
  return normalizeFilename(value)
    .split(/\s+/)
    .filter((t) => t.length > 1); // drop single-char noise
}

/** Strip a numeric suffix used to disambiguate multiple images. */
function stripNumericSuffix(name: string): string {
  return name.replace(/[-_]?\d+$/, "");
}

/* ============================================================
 * Levenshtein
 *
 * Only used on short strings (SKU vs filename stem), so the
 * O(n*m) cost is negligible. Full Wagner-Fischer with a single
 * row to save memory.
 * ============================================================ */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr: number[] = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost, // substitution
      );
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

/** 0–1 similarity score — 1 = identical, 0 = nothing in common. */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/* ============================================================
 * Row preparation
 * ============================================================ */

type PreparedRow = {
  row: ParsedCsvRow;
  sku: string; // lowercase, no spaces
  slug: string; // slug of name.en
  nameTokens: string[]; // tokens of name.en
  explicitFiles: string[]; // filenames from image_files column
};

function prepareRow(row: ParsedCsvRow): PreparedRow | null {
  if (row.status !== "valid" || !row.data) return null;

  const sku = (row.data.sku ?? "").toLowerCase().trim();

  const slug = row.data.slug
    ? row.data.slug.toLowerCase()
    : slugify(row.data.name_en);

  const nameTokens = tokenize(row.data.name_en);

  const explicitFiles = row.data.image_files
    ? row.data.image_files
        .split("|")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return {
    row,
    sku,
    slug,
    nameTokens,
    explicitFiles,
  };
}

/** Minimal local slugifier — matches our server behavior closely enough. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ============================================================
 * Match one image to a row
 * ============================================================ */

type RowMatch = {
  rowIndex: number;
  strategy: MatchStrategy;
  confidence: number;
};

function matchImageToRows(image: StagedImage, rows: PreparedRow[]): RowMatch[] {
  const filenameLower = image.filename.toLowerCase();
  const stem = normalizeFilename(image.filename);
  const stemNoSuffix = stripNumericSuffix(stem);
  const stemTokens = new Set(tokenize(image.filename));

  const matches: RowMatch[] = [];

  for (const prepared of rows) {
    const rowIndex = prepared.row.rowIndex;

    /* --------------------------------------------------------
     * 1. Explicit filename match (image_files column)
     * -------------------------------------------------------- */
    if (
      prepared.explicitFiles.length > 0 &&
      prepared.explicitFiles.includes(filenameLower)
    ) {
      matches.push({ rowIndex, strategy: "sku-exact", confidence: 1.0 });
      continue;
    }

    /* --------------------------------------------------------
     * 2. SKU exact / prefix / contains
     * -------------------------------------------------------- */
    if (prepared.sku) {
      const sku = prepared.sku;
      if (stem === sku || stemNoSuffix === sku) {
        matches.push({ rowIndex, strategy: "sku-exact", confidence: 0.98 });
        continue;
      }

      if (
        stem.startsWith(`${sku}-`) ||
        stem.startsWith(`${sku}_`) ||
        stem.startsWith(`${sku} `)
      ) {
        matches.push({ rowIndex, strategy: "sku-prefix", confidence: 0.95 });
        continue;
      }

      if (stem.includes(sku)) {
        matches.push({
          rowIndex,
          strategy: "sku-contains",
          confidence: 0.85,
        });
        continue;
      }
    }

    /* --------------------------------------------------------
     * 3. Slug match
     * -------------------------------------------------------- */
    if (prepared.slug.length >= 4 && stem.includes(prepared.slug)) {
      matches.push({ rowIndex, strategy: "slug-match", confidence: 0.8 });
      continue;
    }

    /* --------------------------------------------------------
     * 4. Name-token match
     * -------------------------------------------------------- */
    if (prepared.nameTokens.length >= 2) {
      const allPresent = prepared.nameTokens.every((t) => stemTokens.has(t));
      if (allPresent) {
        matches.push({
          rowIndex,
          strategy: "name-tokens",
          confidence: 0.7,
        });
        continue;
      }
    }

    /* --------------------------------------------------------
     * 5. Fuzzy fallback
     * -------------------------------------------------------- */
    if (prepared.sku && prepared.sku.length >= 4) {
      const sim = similarity(stemNoSuffix, prepared.sku);
      if (sim >= 0.85) {
        matches.push({
          rowIndex,
          strategy: "fuzzy",
          confidence: 0.6 * sim,
        });
        continue;
      }
    }

    if (prepared.slug.length >= 8) {
      const sim = similarity(stem, prepared.slug);
      if (sim >= 0.8) {
        matches.push({
          rowIndex,
          strategy: "fuzzy",
          confidence: 0.5 * sim,
        });
      }
    }
  }

  return matches;
}

/* ============================================================
 * Pure implementation — shared by hook and standalone
 *
 * No React, no hooks. Both `useAutoMatcher` and `runAutoMatcher`
 * delegate here, so the matching logic lives in exactly one place.
 * ============================================================ */

function runMatcherImpl(
  rows: ParsedCsvRow[],
  images: StagedImage[],
  options: RunMatcherOptions,
): MatchReport {
  const prepared = rows
    .map(prepareRow)
    .filter((p): p is PreparedRow => p !== null);

  /* Candidates — respect existing assignments */
  const candidates = images.filter((img) => {
    if (options.skipAnyAssigned) return img.assignedToRow === undefined;
    if (options.skipAssigned && !img.autoMatched) {
      return img.assignedToRow === undefined;
    }
    return true;
  });

  type Candidate = { image: StagedImage; matches: RowMatch[] };
  const perImage: Candidate[] = candidates.map((image) => ({
    image,
    matches: matchImageToRows(image, prepared),
  }));

  /* ----------------------------------------------------------
   * Global triplet list — every (image, row, confidence) that
   * survived the per-image matching pass.
   * ---------------------------------------------------------- */

  const triplets: Array<{
    imageId: string;
    rowIndex: number;
    strategy: MatchStrategy;
    confidence: number;
  }> = [];

  for (const { image, matches } of perImage) {
    for (const m of matches) {
      triplets.push({
        imageId: image.id,
        rowIndex: m.rowIndex,
        strategy: m.strategy,
        confidence: m.confidence,
      });
    }
  }

  const strategyRank: Record<MatchStrategy, number> = {
    "sku-exact": 6,
    "sku-prefix": 5,
    "sku-contains": 4,
    "slug-match": 3,
    "name-tokens": 2,
    fuzzy: 1,
    none: 0,
  };

  triplets.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return strategyRank[b.strategy] - strategyRank[a.strategy];
  });

  /* ----------------------------------------------------------
   * Greedy assignment — best confidence first, each image once
   * ---------------------------------------------------------- */

  const assignments: MatchAssignment[] = [];
  const imageTaken = new Set<string>();

  for (const t of triplets) {
    if (imageTaken.has(t.imageId)) continue;
    imageTaken.add(t.imageId);
    assignments.push({
      imageId: t.imageId,
      rowIndex: t.rowIndex,
      strategy: t.strategy,
      confidence: t.confidence,
    });
  }

  /* ----------------------------------------------------------
   * Report
   * ---------------------------------------------------------- */

  const assignedImageIds = new Set(assignments.map((a) => a.imageId));
  const rowsWithImages = new Set(assignments.map((a) => a.rowIndex));

  const unmatchedImages = images.filter(
    (img) => !assignedImageIds.has(img.id) && img.assignedToRow === undefined,
  );

  const unmatchedRows = prepared
    .filter((p) => !rowsWithImages.has(p.row.rowIndex))
    .map((p) => p.row);

  return {
    assignments,
    unmatchedImages,
    unmatchedRows,
    summary: {
      matched: assignments.length,
      unmatchedImages: unmatchedImages.length,
      unmatchedRows: unmatchedRows.length,
    },
  };
}

/* ============================================================
 * Public API
 * ============================================================ */

/**
 * React hook — memoizes the matcher so it can be passed as a
 * stable dependency to `useEffect` and event handlers.
 */
export function useAutoMatcher() {
  const run = useCallback(
    (
      rows: ParsedCsvRow[],
      images: StagedImage[],
      options: RunMatcherOptions = {},
    ): MatchReport => runMatcherImpl(rows, images, options),
    [],
  );

  return { run };
}

/**
 * Standalone version for tests and one-off invocations.
 * Same output as the hook — no React required.
 */
export function runAutoMatcher(
  rows: ParsedCsvRow[],
  images: StagedImage[],
  options: RunMatcherOptions = {},
): MatchReport {
  return runMatcherImpl(rows, images, options);
}
