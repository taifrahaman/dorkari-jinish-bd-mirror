// src/components/admin/image-uploader/ImageUploader.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ImageRef } from "@/services/cloudinary.service";
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

  /**
   * Show an alt-text input under each saved image.
   * Default: true. Alt is optional — the input is a convenience.
   */
  showAltInput?: boolean;

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
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
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
   * Drag & drop
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

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  const hasAny = savedItems.length > 0 || uploadItems.length > 0;

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
          {/* Persisted images — optional alt input below */}
          {savedItems.map((item, idx) => {
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
          })}

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
    </div>
  );
}

export default ImageUploader;
