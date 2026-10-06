// src/components/admin/product-import/steps/Step3MatchImages.tsx

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { MediaTray } from "../MediaTray";
import { ProductDropList, type FilterMode } from "../ProductDropList";
import { AutoMatchBar } from "../AutoMatchBar";
import { useAutoMatcher } from "../useAutoMatcher";
import { useImportStore, type StagedImage } from "../useImportStore";

/* ============================================================
 * Component
 * ============================================================ */

export function Step3MatchImages() {
  const csvRows = useImportStore((s) => s.csvRows);
  const stagedImages = useImportStore((s) => s.stagedImages);
  const assignImage = useImportStore((s) => s.assignImage);
  const unassignImage = useImportStore((s) => s.unassignImage);
  const bulkAssign = useImportStore((s) => s.bulkAssign);
  const setStep = useImportStore((s) => s.setStep);

  const { run } = useAutoMatcher();

  const [filter, setFilter] = useState<FilterMode>("all");
  const [activeImage, setActiveImage] = useState<StagedImage | null>(null);
  const [hasAutoRun, setHasAutoRun] = useState(false);

  /* ----------------------------------------------------------
   * Sensors
   * ---------------------------------------------------------- */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  /* ----------------------------------------------------------
   * Run auto-matcher on first mount
   * ---------------------------------------------------------- */

  useEffect(() => {
    if (hasAutoRun) return;
    if (csvRows.length === 0 || stagedImages.length === 0) return;

    const report = run(csvRows, stagedImages, { skipAnyAssigned: true });

    if (report.assignments.length > 0) {
      bulkAssign(
        report.assignments.map((a) => ({
          imageId: a.imageId,
          rowIndex: a.rowIndex,
          auto: true,
        })),
      );
    }

    setHasAutoRun(true);
  }, [csvRows, stagedImages, hasAutoRun, run, bulkAssign]);

  /* ----------------------------------------------------------
   * Drag handlers
   * ---------------------------------------------------------- */

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const imageId = (event.active.data.current as { imageId?: string })
        ?.imageId;
      if (!imageId) return;
      const image = stagedImages.find((img) => img.id === imageId);
      setActiveImage(image ?? null);
    },
    [stagedImages],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveImage(null);

      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current as
        | { type?: "tray" | "slot"; imageId?: string; fromRow?: number }
        | undefined;
      const overData = over.data.current as
        { type?: "row" | "tray"; rowIndex?: number } | undefined;

      if (!activeData || !overData) return;

      const imageId = activeData.imageId;
      if (!imageId) return;

      /* Tray → Row: assign */
      if (activeData.type === "tray" && overData.type === "row") {
        if (overData.rowIndex !== undefined) {
          assignImage(imageId, overData.rowIndex);
        }
        return;
      }

      /* Slot → Row: reassign (or no-op if same row) */
      if (activeData.type === "slot" && overData.type === "row") {
        if (
          overData.rowIndex !== undefined &&
          activeData.fromRow !== overData.rowIndex
        ) {
          assignImage(imageId, overData.rowIndex);
        }
        return;
      }

      /* Slot → Tray: unassign */
      if (activeData.type === "slot" && overData.type === "tray") {
        unassignImage(imageId);
        return;
      }

      /* Tray → Tray: no-op (tray is unordered) */
    },
    [assignImage, unassignImage],
  );

  const handleDragCancel = useCallback(() => {
    setActiveImage(null);
  }, []);

  /* ----------------------------------------------------------
   * Navigation gating
   * ---------------------------------------------------------- */

  const { canProceed, remaining } = useMemo(() => {
    const validRows = csvRows.filter((r) => r.status === "valid");
    const rowIndexesWithImages = new Set(
      stagedImages
        .filter((img) => img.assignedToRow !== undefined)
        .map((img) => img.assignedToRow),
    );
    const without = validRows.filter(
      (r) => !rowIndexesWithImages.has(r.rowIndex),
    ).length;
    return {
      canProceed: true,
      remaining: without,
    };
  }, [csvRows, stagedImages]);

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <AutoMatchBar filter={filter} onFilterChange={setFilter} />

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <MediaTray />
          <div className="max-h-[calc(100vh-220px)] overflow-auto pr-1">
            <ProductDropList filter={filter} />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeImage ? (
            <div className="pointer-events-none overflow-hidden rounded-md border-2 border-brand-accent shadow-xl">
              <img
                src={activeImage.url}
                alt=""
                className="h-24 w-24 object-cover"
                draggable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-4">
        <Button type="button" variant="outline" onClick={() => setStep(2)}>
          Back
        </Button>

        <div className="flex items-center gap-3">
          {remaining > 0 && (
            <p className="text-xs text-brand-text-secondary">
              {remaining} product{remaining === 1 ? "" : "s"} without images —
              you can continue anyway.
            </p>
          )}

          <Button
            type="button"
            onClick={() => setStep(4)}
            disabled={!canProceed}
            className="min-w-35"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step3MatchImages;
