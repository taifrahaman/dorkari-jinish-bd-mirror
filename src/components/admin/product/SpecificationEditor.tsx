// src/components/admin/product/SpecificationEditor.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SpecKeyCombobox } from "./SpecKeyCombobox";

/* ============================================================
 * Types
 * ============================================================ */

export type SpecificationEditorProps = {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  /** Optional category to bias suggestions. */
  categoryId?: string;
  disabled?: boolean;
  className?: string;
};

/* ============================================================
 * Row type — stable identity for React
 * ============================================================ */

type Row = {
  id: string;
  key: string;
  value: string;
};

function makeId(): string {
  return `spec-${Math.random().toString(36).slice(2, 9)}`;
}

/* ============================================================
 * Component
 * ============================================================ */

export function SpecificationEditor({
  value,
  onChange,
  categoryId,
  disabled = false,
  className,
}: SpecificationEditorProps) {
  /* ----------------------------------------------------------
   * Local row model with stable ids.
   *
   * We keep our own array of {id, key, value} so:
   *   - inputs don't lose focus when the object is rebuilt
   *   - removing a row doesn't shift other rows' identities
   *
   * The parent's `Record<string, string>` is the source of
   * truth on submit; we serialize to it after every change.
   * ---------------------------------------------------------- */

  const [rows, setRows] = useState<Row[]>(() => toRows(value));

  /* Track the last value we emitted so we can tell whether an
   * incoming change is external or an echo of our own update. */
  const lastEmittedRef = useRef<string>("");

  useEffect(() => {
    const serialized = serialize(rows);
    // External update — rebuild rows
    const incoming = JSON.stringify(value);
    if (incoming !== lastEmittedRef.current) {
      const rebuilt = toRows(value);
      // Only rebuild if the shape actually changed (avoids loops)
      if (JSON.stringify(serialize(rebuilt)) !== JSON.stringify(serialized)) {
        setRows(rebuilt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /* ----------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------- */

  const commit = (next: Row[]) => {
    setRows(next);
    const serialized = serialize(next);
    lastEmittedRef.current = JSON.stringify(serialized);
    onChange(serialized);
  };

  /* ----------------------------------------------------------
   * Row operations
   * ---------------------------------------------------------- */

  const updateKey = (index: number, nextKey: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], key: nextKey };
    commit(next);
  };

  const updateValue = (index: number, nextValue: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], value: nextValue };
    commit(next);
  };

  const removeAt = (index: number) => {
    const next = rows.slice();
    next.splice(index, 1);
    commit(next);
  };

  const addRow = () => {
    const next = rows.slice();
    next.push({
      id: makeId(),
      key: suggestNewKey(next.map((r) => r.key)),
      value: "",
    });
    commit(next);
  };

  /* ----------------------------------------------------------
   * Set of keys currently in use (for "already used" hint)
   * ---------------------------------------------------------- */

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.key).filter(Boolean)),
    [rows],
  );

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className={cn("space-y-3", className)}>
      {rows.length === 0 && (
        <p className="text-xs text-brand-text-secondary">
          No specifications yet. Add one to describe the product.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
        >
          <SpecKeyCombobox
            value={row.key}
            onChange={(next) => updateKey(index, next)}
            categoryId={categoryId}
            usedKeys={usedKeys}
            disabled={disabled}
          />

          <Input
            value={row.value}
            onChange={(e) => updateValue(index, e.target.value)}
            placeholder="1.5 Ton"
            className="h-9"
            disabled={disabled}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeAt(index)}
            disabled={disabled}
            className="h-9 w-9 text-brand-text-secondary hover:text-destructive"
            aria-label="Remove specification"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled}
        className="h-8"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        Add specification
      </Button>
    </div>
  );
}

export default SpecificationEditor;

/* ============================================================
 * Row serialization helpers
 * ============================================================ */

function toRows(value: Record<string, string>): Row[] {
  return Object.entries(value).map(([key, val]) => ({
    id: makeId(),
    key,
    value: val,
  }));
}

/**
 * Convert rows back into a Record. Later rows win on duplicate
 * keys — same behavior as the old editor.
 */
function serialize(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.key.trim() === "") continue;
    out[row.key] = row.value;
  }
  return out;
}

/**
 * Suggest the next unused "New spec N" key.
 */
function suggestNewKey(existing: string[]): string {
  const base = "new_spec";
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}
