// src/components/admin/product-import/steps/Step2UploadImages.tsx

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Images,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCloudinaryUpload,
  type UploadItem,
} from "@/components/admin/image-uploader";
import { useImportStore } from "../useImportStore";

/* ============================================================
 * Constants
 * ============================================================ */

const MAX_IMAGES = 500;

/* ============================================================
 * Component
 * ============================================================ */

export function Step2UploadImages() {
  const sessionId = useImportStore((s) => s.sessionId);
  const stagedImages = useImportStore((s) => s.stagedImages);
  const addStagedImage = useImportStore((s) => s.addStagedImage);
  const setStep = useImportStore((s) => s.setStep);
  const validRowsCount = useImportStore(
    (s) => s.csvRows.filter((r) => r.status === "valid").length,
  );

  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCloudinaryUpload({
    entity: "tmp",
    owner: sessionId,
    concurrency: 6,
    getPublicId: (file) => {
      const base = file.name.replace(/\.[^.]+$/, "");
      return (
        base
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 100) || "image"
      );
    },
  });

  /* ----------------------------------------------------------
   * Bridge hook completions into the store
   * ---------------------------------------------------------- */

  const syncedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newlyDone = upload.items.filter(
      (it) =>
        it.status === "done" && it.result && !syncedIdsRef.current.has(it.id),
    );

    if (newlyDone.length === 0) return;

    for (const item of newlyDone) {
      syncedIdsRef.current.add(item.id);
      addStagedImage({
        id: item.id,
        filename: item.filename,
        url: item.result!.url,
        tmpPublicId: item.result!.publicId,
      });
    }
  }, [upload.items, addStagedImage]);

  /* ----------------------------------------------------------
   * File handlers
   * ---------------------------------------------------------- */

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const remaining = MAX_IMAGES - upload.items.length;
      if (remaining <= 0) return;

      upload.addFiles(list.slice(0, remaining));
    },
    [upload],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /* ----------------------------------------------------------
   * Derived counts
   * ---------------------------------------------------------- */

  const totalQueued = upload.items.length;
  const doneCount = upload.completedCount;
  const errorCount = upload.errorCount;
  const uploadingCount = totalQueued - doneCount - errorCount;

  const allSettled =
    totalQueued > 0 && uploadingCount === 0 && upload.items.length > 0;

  const canProceed = doneCount > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-md border border-brand-accent/30 bg-brand-accent-light px-4 py-3 text-sm text-brand-primary">
        <Images className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">Upload all product images now.</p>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            Drag everything in — folder contents, ZIP extract, whatever.
            You&apos;ll match them to products by name in the next step.
            {validRowsCount > 0 && (
              <>
                {" "}
                <strong>{validRowsCount}</strong> product
                {validRowsCount === 1 ? "" : "s"} waiting for images.
              </>
            )}
          </p>
        </div>
      </div>

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-brand-border bg-muted/30 px-6 py-12 text-center transition-colors",
          "hover:border-brand-accent/60 hover:bg-muted/50",
          isDragging && "border-brand-accent bg-brand-accent-light",
        )}
      >
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-surface text-brand-text-secondary">
          <Upload className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-brand-primary">
            {isDragging
              ? "Drop images here"
              : "Drop images here, or click to browse"}
          </p>
          <p className="text-xs text-brand-text-secondary">
            JPG, PNG, WebP, AVIF · up to 5 MB each · {MAX_IMAGES} max
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={onInputChange}
        />
      </div>

      {totalQueued > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-4 py-3">
          {uploadingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-muted px-2 py-1 text-xs font-medium text-brand-text-secondary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              {uploadingCount} uploading
            </span>
          )}
          {doneCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {doneCount} ready
            </span>
          )}
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errorCount} failed
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {errorCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={upload.retryAllFailed}
                className="h-7 px-2 text-xs"
              >
                Retry failed
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={upload.clear}
              disabled={uploadingCount > 0}
              className="h-7 px-2 text-xs text-brand-text-secondary hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" aria-hidden="true" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {totalQueued > 0 && (
        <div className="max-h-105 overflow-auto rounded-md border border-brand-border bg-brand-surface p-3">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {upload.items.map((item) => (
              <ThumbnailCell
                key={item.id}
                item={item}
                onRemove={upload.removeItem}
                onRetry={upload.retryItem}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          disabled={uploadingCount > 0}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          {stagedImages.length > 0 && !allSettled && (
            <p className="text-xs text-brand-text-secondary">
              Waiting for uploads to finish…
            </p>
          )}

          <Button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canProceed || !allSettled}
            className="min-w-35"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step2UploadImages;

/* ============================================================
 * Thumbnail cell
 * ============================================================ */

function ThumbnailCell({
  item,
  onRemove,
  onRetry,
}: {
  item: UploadItem;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const { status, progress, previewUrl, error, filename } = item;

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border border-brand-border bg-muted",
        status === "error" && "border-destructive/50",
      )}
      title={filename}
    >
      <img
        src={previewUrl}
        alt={filename}
        className={cn(
          "h-full w-full object-cover",
          status === "uploading" && "opacity-60",
          status === "error" && "opacity-40",
        )}
        loading="lazy"
      />

      {status === "uploading" && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <div className="text-[10px] font-medium tabular-nums text-white">
            {progress}%
          </div>
        </div>
      )}

      {status === "pending" && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <Loader2
            className="h-4 w-4 animate-spin text-white"
            aria-hidden="true"
          />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 px-1 text-center">
          <p className="line-clamp-3 text-[9px] leading-tight text-white">
            {error ?? "Failed"}
          </p>
          <button
            type="button"
            onClick={() => onRetry(item.id)}
            className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-medium text-brand-primary hover:bg-white"
          >
            Retry
          </button>
        </div>
      )}

      {status !== "uploading" && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
          aria-label={`Remove ${filename}`}
        >
          <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
