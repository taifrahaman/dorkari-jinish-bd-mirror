// src/components/admin/product-import/useImportStore.ts

"use client";

import { create } from "zustand";
import type {
  CsvRow,
  ImportOptions,
  ImportResult,
} from "@/lib/validations/import.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type WizardStep = 1 | 2 | 3 | 4;

/** A single CSV row, parsed + validated. */
export type ParsedCsvRow = {
  /** Index in the original CSV (0-based). */
  rowIndex: number;
  /** Raw cell values straight from PapaParse. */
  raw: Record<string, string>;
  /** Populated when the row validated successfully. */
  data?: CsvRow;
  /** Validation error messages when the row is invalid. */
  errors: string[];
  status: "valid" | "invalid";
};

/** A Cloudinary-uploaded image staged for the matching step. */
export type StagedImage = {
  /** Local id (matches the upload hook's item id). */
  id: string;
  filename: string;
  /** Cloudinary secure URL after upload. */
  url: string;
  /** Cloudinary `tmp/<session>/...` public_id — used for promotion. */
  tmpPublicId: string;
  /** Which product row this image is assigned to (row index). */
  assignedToRow?: number;
  /** True when assignment came from the auto-matcher. */
  autoMatched?: boolean;
};

/** Commit progress state. */
export type CommitState = {
  running: boolean;
  result?: ImportResult;
  error?: string;
};

type ImportStoreState = {
  step: WizardStep;
  sessionId: string;
  fileName: string | null;

  csvRows: ParsedCsvRow[];
  stagedImages: StagedImage[];

  options: ImportOptions;

  commit: CommitState;

  /* Actions */
  setStep: (step: WizardStep) => void;
  setFileName: (name: string | null) => void;
  setCsvRows: (rows: ParsedCsvRow[]) => void;

  addStagedImage: (image: StagedImage) => void;
  removeStagedImage: (id: string) => void;

  assignImage: (imageId: string, rowIndex: number, auto?: boolean) => void;
  unassignImage: (imageId: string) => void;
  bulkAssign: (
    assignments: Array<{ imageId: string; rowIndex: number; auto?: boolean }>,
  ) => void;

  setOptions: (patch: Partial<ImportOptions>) => void;

  setCommit: (patch: Partial<CommitState>) => void;

  reset: () => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function newSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${time}-${rand}`;
}

const DEFAULT_OPTIONS: ImportOptions = {
  onDuplicate: "skip",
  createMissingCategories: true,
  createMissingBrands: false,
  skipEmptyRows: true,
  dryRun: false,
};

/* ============================================================
 * Store
 * ============================================================ */

export const useImportStore = create<ImportStoreState>((set) => ({
  step: 1,
  sessionId: newSessionId(),
  fileName: null,

  csvRows: [],
  stagedImages: [],

  options: DEFAULT_OPTIONS,

  commit: { running: false },

  /* ----------------------------------------------------------
   * Step / meta
   * ---------------------------------------------------------- */

  setStep: (step) => set({ step }),

  setFileName: (fileName) => set({ fileName }),

  /* ----------------------------------------------------------
   * CSV rows
   * ---------------------------------------------------------- */

  setCsvRows: (csvRows) => set({ csvRows }),

  /* ----------------------------------------------------------
   * Images
   * ---------------------------------------------------------- */

  addStagedImage: (image) =>
    set((state) => {
      // Skip duplicates (same id already staged)
      if (state.stagedImages.some((img) => img.id === image.id)) {
        return state;
      }
      return { stagedImages: [...state.stagedImages, image] };
    }),

  removeStagedImage: (id) =>
    set((state) => ({
      stagedImages: state.stagedImages.filter((img) => img.id !== id),
    })),

  assignImage: (imageId, rowIndex, auto = false) =>
    set((state) => ({
      stagedImages: state.stagedImages.map((img) =>
        img.id === imageId
          ? { ...img, assignedToRow: rowIndex, autoMatched: auto }
          : img,
      ),
    })),

  unassignImage: (imageId) =>
    set((state) => ({
      stagedImages: state.stagedImages.map((img) =>
        img.id === imageId
          ? { ...img, assignedToRow: undefined, autoMatched: false }
          : img,
      ),
    })),

  bulkAssign: (assignments) =>
    set((state) => {
      const map = new Map(
        assignments.map((a) => [
          a.imageId,
          { rowIndex: a.rowIndex, auto: a.auto ?? true },
        ]),
      );
      return {
        stagedImages: state.stagedImages.map((img) => {
          const hit = map.get(img.id);
          if (!hit) return img;
          return {
            ...img,
            assignedToRow: hit.rowIndex,
            autoMatched: hit.auto,
          };
        }),
      };
    }),

  /* ----------------------------------------------------------
   * Options
   * ---------------------------------------------------------- */

  setOptions: (patch) =>
    set((state) => ({ options: { ...state.options, ...patch } })),

  /* ----------------------------------------------------------
   * Commit
   * ---------------------------------------------------------- */

  setCommit: (patch) =>
    set((state) => ({ commit: { ...state.commit, ...patch } })),

  /* ----------------------------------------------------------
   * Reset
   * ---------------------------------------------------------- */

  reset: () =>
    set({
      step: 1,
      sessionId: newSessionId(),
      fileName: null,
      csvRows: [],
      stagedImages: [],
      options: DEFAULT_OPTIONS,
      commit: { running: false },
    }),
}));

/* ============================================================
 * Selectors — keep components lean
 * ============================================================ */

export function selectValidRows(state: ImportStoreState): ParsedCsvRow[] {
  return state.csvRows.filter((r) => r.status === "valid");
}

export function selectInvalidRows(state: ImportStoreState): ParsedCsvRow[] {
  return state.csvRows.filter((r) => r.status === "invalid");
}

export function selectImagesForRow(
  state: ImportStoreState,
  rowIndex: number,
): StagedImage[] {
  return state.stagedImages
    .filter((img) => img.assignedToRow === rowIndex)
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

export function selectUnassignedImages(state: ImportStoreState): StagedImage[] {
  return state.stagedImages.filter((img) => img.assignedToRow === undefined);
}

export function selectRowHasImages(
  state: ImportStoreState,
  rowIndex: number,
): boolean {
  return state.stagedImages.some((img) => img.assignedToRow === rowIndex);
}
