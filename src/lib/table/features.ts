// src/lib/table/features.ts

import {
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

/* ============================================================
 * App-wide TanStack Table feature set
 *
 * v9 makes features opt-in for tree-shaking. We declare the ones
 * used across the admin once, here, and reference `AppFeatures`
 * everywhere else so they stay in sync.
 *
 * Client-side row models are intentionally omitted — our tables
 * are server-driven (sorting, filtering, pagination all happen
 * in MongoDB). Features provide the state + APIs; row models
 * would process data in the browser, which we don't want.
 * ============================================================ */

export const appFeatures = tableFeatures({
  columnSizingFeature, // getSize(), column widths
  columnVisibilityFeature, // getCanHide, toggleVisibility
  rowPaginationFeature, // pagination state
  rowSelectionFeature, // getIsSelected, toggleSelected, getSelectedRowModel
  rowSortingFeature, // getCanSort, toggleSorting, getIsSorted
});

export type AppFeatures = typeof appFeatures;
