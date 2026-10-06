// src/components/admin/category/SpecTemplateEditor.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpecKeyCombobox } from "@/components/admin/product/SpecKeyCombobox";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type SpecTemplateEditorProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
};

/* ============================================================
 * Row type — stable identity
 * ============================================================ */

type Row = {
  id: string;
  key: string;
};

function makeId(): string {
  return `tpl-${Math.random().toString(36).slice(2, 9)}`;
}

/* ============================================================
 * Component
 * ============================================================ */

export function SpecTemplateEditor({
  value,
  onChange,
  disabled = false,
  className,
}: SpecTemplateEditorProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(value));

  const lastEmittedRef = useRef<string>("");

  /* Sync external changes without clobbering local state */
  useEffect(() => {
    const incoming = JSON.stringify(value);
    if (incoming !== lastEmittedRef.current) {
      const rebuilt = toRows(value);
      if (JSON.stringify(serialize(rebuilt)) !== JSON.stringify(value)) {
        setRows(rebuilt);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (next: Row[]) => {
    setRows(next);
    const serialized = serialize(next);
    lastEmittedRef.current = JSON.stringify(serialized);
    onChange(serialized);
  };

  const updateKey = (index: number, nextKey: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], key: nextKey };
    commit(next);
  };

  const removeAt = (index: number) => {
    const next = rows.slice();
    next.splice(index, 1);
    commit(next);
  };

  const addRow = () => {
    const next = rows.slice();
    next.push({ id: makeId(), key: "" });
    commit(next);
  };

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.key).filter(Boolean)),
    [rows],
  );

  return (
    <div className={cn("space-y-3", className)}>
      {rows.length === 0 && (
        <p className="text-xs text-brand-text-secondary">
          No template keys yet. Products created in this category will get these
          keys pre-filled (with empty values).
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.id}
          className="grid grid-cols-[1fr_auto] items-center gap-2"
        >
          <SpecKeyCombobox
            value={row.key}
            onChange={(next) => updateKey(index, next)}
            usedKeys={usedKeys}
            disabled={disabled}
            placeholder="capacity"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeAt(index)}
            disabled={disabled}
            className="h-9 w-9 text-brand-text-secondary hover:text-destructive"
            aria-label="Remove template key"
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
        Add template key
      </Button>
    </div>
  );
}

export default SpecTemplateEditor;

/* ============================================================
 * Serialization
 * ============================================================ */

function toRows(value: string[]): Row[] {
  return value.map((key) => ({ id: makeId(), key }));
}

function serialize(rows: Row[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
