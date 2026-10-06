// src/components/admin/product-import/MediaTray.tsx

"use client";

import { useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Images, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MediaTrayItem } from "./MediaTrayItem";
import { useImportStore } from "./useImportStore";

/* ============================================================
 * Component
 * ============================================================ */

export function MediaTray() {
  const stagedImages = useImportStore((s) => s.stagedImages);

  const [search, setSearch] = useState("");

  const { setNodeRef, isOver } = useDroppable({
    id: "tray-drop-zone",
    data: { type: "tray" },
  });

  /* Show only unassigned images here — assigned ones live in rows */
  const unassigned = useMemo(
    () => stagedImages.filter((img) => img.assignedToRow === undefined),
    [stagedImages],
  );

  const visible = useMemo(() => {
    if (!search.trim()) return unassigned;
    const needle = search.trim().toLowerCase();
    return unassigned.filter((img) =>
      img.filename.toLowerCase().includes(needle),
    );
  }, [unassigned, search]);

  const total = stagedImages.length;
  const assignedCount = total - unassigned.length;

  return (
    <aside className="flex h-[calc(100vh-220px)] flex-col rounded-md border border-brand-border bg-brand-surface">
      {/* Header */}
      <header className="border-b border-brand-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-brand-primary">
              Image tray
            </h3>
          </div>
          <span className="text-xs text-brand-text-secondary tabular-nums">
            {assignedCount}/{total}
          </span>
        </div>

        {unassigned.length > 0 && (
          <div className="relative mt-2">
            <Search
              className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-text-secondary"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by filename…"
              className="h-8 pl-7 text-xs"
            />
          </div>
        )}
      </header>

      {/* Scrollable grid */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-auto p-3 transition-colors",
          isOver && "bg-brand-accent-light/40",
        )}
      >
        {unassigned.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
              <Images className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-xs text-brand-text-secondary">
              {total === 0
                ? "No images uploaded."
                : "All images are assigned. Drop one here to unassign."}
            </p>
          </div>
        ) : visible.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-brand-text-secondary">
            No images match &quot;{search}&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((img) => (
              <MediaTrayItem key={img.id} image={img} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default MediaTray;
