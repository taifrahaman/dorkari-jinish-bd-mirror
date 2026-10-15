// src/components/admin/customer/TagInput.tsx

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type TagInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag…",
  maxTags = 20,
  disabled = false,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    if (value.includes(tag)) {
      setDraft("");
      return;
    }
    if (value.length >= maxTags) return;
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-brand-border bg-brand-surface p-2",
        disabled && "opacity-60",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-muted px-2 py-0.5 text-xs text-brand-primary"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(tag)}
              className="grid h-3.5 w-3.5 place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-destructive/20 hover:text-destructive"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" aria-hidden="true" />
            </button>
          )}
        </span>
      ))}

      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        disabled={disabled || value.length >= maxTags}
        className="h-7 min-w-[140px] flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        autoComplete="off"
      />
    </div>
  );
}

export default TagInput;
