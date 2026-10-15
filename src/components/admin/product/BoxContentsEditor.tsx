// src/components/admin/product/BoxContentsEditor.tsx

"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type BoxContentRow = {
  en?: string;
  bn?: string;
};

type BoxContentsEditorProps = {
  value: BoxContentRow[];
  onChange: (next: BoxContentRow[]) => void;
  maxRows?: number;
};

/**
 * Repeating editor for the "In the box" list.
 * Two inputs per row (English + Bengali) plus a delete button.
 * Rows with both fields empty are filtered out on submit by the parent form.
 */
export function BoxContentsEditor({
  value,
  onChange,
  maxRows = 20,
}: BoxContentsEditorProps) {
  const rows = value ?? [];

  const updateRow = (index: number, patch: Partial<BoxContentRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    if (rows.length >= maxRows) return;
    onChange([...rows, { en: "", bn: "" }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="rounded-md border border-dashed border-brand-border bg-muted/20 px-3 py-4 text-center text-xs text-brand-text-secondary">
          No items yet. Add things like &ldquo;Non-stick inner pot&rdquo; or
          &ldquo;Measuring cup&rdquo;.
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={row.en ?? ""}
            onChange={(e) => updateRow(index, { en: e.target.value })}
            placeholder="Rice cooker body & lid"
            className="flex-1"
            aria-label={`Item ${index + 1} (English)`}
          />

          <Input
            value={row.bn ?? ""}
            onChange={(e) => updateRow(index, { bn: e.target.value })}
            placeholder="রাইস কুকারের বডি ও ঢাকনা"
            className="flex-1"
            aria-label={`Item ${index + 1} (বাংলা)`}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
            aria-label={`Remove item ${index + 1}`}
            className="flex-none text-brand-text-secondary hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={rows.length >= maxRows}
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}
