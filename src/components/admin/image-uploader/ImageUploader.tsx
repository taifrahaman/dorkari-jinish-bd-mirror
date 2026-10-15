// src/components/admin/image-uploader/ImageUploader.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, ImagePlus, Images, Loader2, Plus } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageRef } from "@/services/cloudinary.service";
import { MediaPickerModal } from "@/components/admin/media/MediaPickerModal";
import type { MediaAsset } from "@/services/media.service";
import {
  useCloudinaryUpload,
  type CloudinaryEntity,
  type UploadItem,
} from "./useCloudinaryUpload";
import { ImageItem } from "./ImageItem";

/* ============================================================
 * Types
 * ============================================================ */

export type ImageUploaderProps = {
  entity: CloudinaryEntity;
  owner: string;

  value: ImageRef[];
  onChange: (images: ImageRef[]) => void;

  maxImages?: number;

  getPublicId?: (file: File, index: number) => string;

  /** Show an alt-text input under each saved image. Default: true. */
  showAltInput?: boolean;

  /** Enable drag-to-reorder for saved images. Default: true. */
  sortable?: boolean;

  /** Show the "Choose from library" button. Default: true. */
  showLibraryPicker?: boolean;

  /** Folder filter for the library picker. Defaults to `entity`. */
  pickerEntity?: "all" | "products" | "categories" | "brands";

  disabled?: boolean;

  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ImageUploader({
  entity,
  owner,
  value,
  onChange,
  maxImages = 10,
  getPublicId,
  showAltInput = true,
  sortable = true,
  showLibraryPicker = true,
  pickerEntity,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const mergedIdsRef = useRef<Set<string>>(new Set());

  const upload = useCloudinaryUpload({
    entity,
    owner,
    getPublicId,
  });

  const { items: uploadItems, removeItem, addFiles } = upload;

  const totalCount = value.length + uploadItems.length;
  const atMax = totalCount >= maxImages;
  const remainingSlots = Math.max(0, maxImages - totalCount);

  /* ----------------------------------------------------------
   * Merge completed uploads into `value`
   * ---------------------------------------------------------- */

  useEffect(() => {
    const newlyDone = uploadItems.filter(
      (it) =>
        it.status === "done" && it.result && !mergedIdsRef.current.has(it.id),
    );

    if (newlyDone.length === 0) return;

    newlyDone.forEach((it) => mergedIdsRef.current.add(it.id));

    const newRefs: ImageRef[] = newlyDone.map((it) => ({
      url: it.result!.url,
      publicId: it.result!.publicId,
      alt: "",
    }));

    onChange([...value, ...newRefs]);
    newlyDone.forEach((it) => removeItem(it.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadItems, removeItem]);

  /* ----------------------------------------------------------
   * File handling
   * ---------------------------------------------------------- */

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;

      const list = Array.from(files);
      if (list.length === 0) return;

      const accepted = list.slice(0, remainingSlots);
      if (accepted.length === 0) return;

      addFiles(accepted);
    },
    [addFiles, disabled, remainingSlots],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  /* ----------------------------------------------------------
   * Drag & drop (file drop)
   * ---------------------------------------------------------- */

  const onDragEnter = (e: React.DragEvent) => {
    if (disabled || atMax) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    if (disabled || atMax) return;
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || atMax) return;
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /* ----------------------------------------------------------
   * Operations on saved `value`
   * ---------------------------------------------------------- */

  const handleRemoveSaved = useCallback(
    (publicId: string) => {
      onChange(value.filter((img) => img.publicId !== publicId));
    },
    [onChange, value],
  );

  const handleSetPrimary = useCallback(
    (publicId: string) => {
      const idx = value.findIndex((img) => img.publicId === publicId);
      if (idx <= 0) return;
      const next = [...value];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      onChange(next);
    },
    [onChange, value],
  );

  const handleAltChange = useCallback(
    (index: number, alt: string) => {
      const next = value.slice();
      next[index] = { ...next[index], alt };
      onChange(next);
    },
    [onChange, value],
  );

  /* ----------------------------------------------------------
   * Library picker → append selected assets
   * ---------------------------------------------------------- */

  const handlePickerConfirm = useCallback(
    (picked: MediaAsset[]) => {
      const existing = new Set(value.map((v) => v.publicId));
      const room = Math.max(0, maxImages - value.length);

      const additions: ImageRef[] = [];
      for (const asset of picked) {
        if (existing.has(asset.publicId)) continue;
        if (additions.length >= room) break;
        additions.push({
          url: asset.url,
          publicId: asset.publicId,
          alt: "",
        });
      }

      if (additions.length === 0) return;
      onChange([...value, ...additions]);
    },
    [onChange, value, maxImages],
  );

  const existingPublicIds = useMemo(
    () => new Set(value.map((v) => v.publicId)),
    [value],
  );

  /* ----------------------------------------------------------
   * Sortable (drag-to-reorder) for saved images
   * ---------------------------------------------------------- */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = value.findIndex(
        (img) => `saved-${img.publicId}` === active.id,
      );
      const newIndex = value.findIndex(
        (img) => `saved-${img.publicId}` === over.id,
      );

      if (oldIndex === -1 || newIndex === -1) return;
      onChange(arrayMove(value, oldIndex, newIndex));
    },
    [onChange, value],
  );

  /* ----------------------------------------------------------
   * Synthetic items for saved refs
   * ---------------------------------------------------------- */

  const savedItems = useMemo<UploadItem[]>(
    () =>
      value.map((ref) => ({
        id: `saved-${ref.publicId}`,
        filename: ref.publicId.split("/").pop() ?? ref.publicId,
        previewUrl: ref.url,
        status: "done" as const,
        progress: 100,
        result: { url: ref.url, publicId: ref.publicId },
      })),
    [value],
  );

  const sortableIds = useMemo(
    () => savedItems.map((it) => it.id),
    [savedItems],
  );

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  const hasAny = savedItems.length > 0 || uploadItems.length > 0;
  const resolvedPickerEntity =
    pickerEntity ?? (entity === "tmp" ? "all" : entity);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      {!atMax && (
        <div
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          aria-disabled={disabled}
          aria-label="Drop images or click to browse"
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-brand-border bg-muted/30 px-6 py-8 text-center transition-colors",
            !disabled && "hover:border-brand-accent/60 hover:bg-muted/50",
            isDragOver &&
              !disabled &&
              "border-brand-accent bg-brand-accent-light",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-surface text-brand-text-secondary">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-medium text-brand-primary">
              {isDragOver
                ? "Drop images here"
                : "Drag & drop images, or click to browse"}
            </p>
            <p className="text-xs text-brand-text-secondary">
              JPG, PNG, WebP, AVIF · up to 5 MB each · {remainingSlots} slot
              {remainingSlots !== 1 ? "s" : ""} left
            </p>
          </div>
        </div>
      )}

      {/* Library picker trigger */}
      {showLibraryPicker && !atMax && (
        <div className="flex items-center justify-center gap-2">
          <span className="h-px flex-1 bg-brand-border" aria-hidden />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => !disabled && setPickerOpen(true)}
            disabled={disabled}
            className="gap-1.5 text-xs"
          >
            <Images className="h-3.5 w-3.5" />
            Choose from library
          </Button>
          <span className="h-px flex-1 bg-brand-border" aria-hidden />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={onInputChange}
        disabled={disabled}
      />

      {/* Grid */}
      {hasAny && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sortable ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableIds}
                strategy={rectSortingStrategy}
              >
                {savedItems.map((item, idx) => {
                  const ref = value[idx];
                  return (
                    <SortableImageTile key={item.id} id={item.id}>
                      <ImageItem
                        item={item}
                        isPrimary={idx === 0}
                        onSetPrimary={() =>
                          handleSetPrimary(item.result!.publicId)
                        }
                        onRemove={() =>
                          handleRemoveSaved(item.result!.publicId)
                        }
                      />

                      {showAltInput && (
                        <Input
                          value={ref?.alt ?? ""}
                          onChange={(e) => handleAltChange(idx, e.target.value)}
                          placeholder="Alt text (optional)"
                          maxLength={200}
                          disabled={disabled}
                          className="h-8 text-xs"
                          aria-label={`Alt text for image ${idx + 1}`}
                        />
                      )}
                    </SortableImageTile>
                  );
                })}
              </SortableContext>
            </DndContext>
          ) : (
            savedItems.map((item, idx) => {
              const ref = value[idx];
              return (
                <div key={item.id} className="space-y-1.5">
                  <ImageItem
                    item={item}
                    isPrimary={idx === 0}
                    onSetPrimary={() => handleSetPrimary(item.result!.publicId)}
                    onRemove={() => handleRemoveSaved(item.result!.publicId)}
                  />
                  {showAltInput && (
                    <Input
                      value={ref?.alt ?? ""}
                      onChange={(e) => handleAltChange(idx, e.target.value)}
                      placeholder="Alt text (optional)"
                      maxLength={200}
                      disabled={disabled}
                      className="h-8 text-xs"
                      aria-label={`Alt text for image ${idx + 1}`}
                    />
                  )}
                </div>
              );
            })
          )}

          {/* Transient uploads */}
          {uploadItems.map((item) => (
            <ImageItem
              key={item.id}
              item={item}
              onRemove={removeItem}
              onRetry={upload.retryItem}
            />
          ))}

          {/* Add-more tile */}
          {!atMax && hasAny && (
            <button
              type="button"
              onClick={() => !disabled && inputRef.current?.click()}
              disabled={disabled}
              aria-label="Add more images"
              className={cn(
                "grid aspect-square place-items-center self-start rounded-md border-2 border-dashed border-brand-border bg-muted/30 text-brand-text-secondary transition-colors",
                !disabled &&
                  "hover:border-brand-accent/60 hover:bg-muted/50 hover:text-brand-primary",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Upload status */}
      {uploadItems.length > 0 && (
        <div className="flex items-center justify-between text-xs text-brand-text-secondary">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            <span>
              Uploading {upload.completedCount + upload.errorCount} of{" "}
              {uploadItems.length} ({upload.totalProgress}%)
            </span>
          </div>

          {upload.errorCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-destructive">
                {upload.errorCount} failed
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={upload.retryAllFailed}
                className="h-6 px-2 text-xs"
              >
                Retry all
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Library picker modal */}
      {showLibraryPicker && (
        <MediaPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          maxSelectable={remainingSlots}
          disabledIds={existingPublicIds}
          onConfirm={handlePickerConfirm}
          defaultEntity={resolvedPickerEntity}
        />
      )}
    </div>
  );
}

export default ImageUploader;

/* ============================================================
 * Sortable tile wrapper
 * ============================================================ */

function SortableImageTile({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className="relative space-y-1.5"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className={cn(
          "absolute -left-1.5 -top-1.5 z-10 grid h-6 w-6 cursor-grab touch-none place-items-center rounded-full border border-brand-border bg-brand-surface text-brand-text-secondary shadow-sm transition-colors",
          "hover:bg-muted active:cursor-grabbing",
        )}
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {children}
    </div>
  );
}
