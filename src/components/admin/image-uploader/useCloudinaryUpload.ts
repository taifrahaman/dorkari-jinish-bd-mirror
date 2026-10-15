// src/components/admin/image-uploader/useCloudinaryUpload.ts

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signUpload, type SignUploadResponse } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type CloudinaryEntity = "products" | "categories" | "brands" | "tmp";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export type UploadItem = {
  /** Client-side id for tracking. */
  id: string;
  /**
   * The original File object. Present while uploading.
   * Absent for already-saved images reconstructed from `value`.
   */
  file?: File;
  /** Always present — falls back to a derived name for saved images. */
  filename: string;
  /** Object URL for immediate preview. */
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  result?: { url: string; publicId: string };
  error?: string;
};

export type UseCloudinaryUploadOptions = {
  entity: CloudinaryEntity;
  owner: string;
  concurrency?: number;
  getPublicId?: (file: File, index: number) => string;
  onUploaded?: (item: UploadItem) => void;
  onSettled?: (items: UploadItem[]) => void;
};

export type UseCloudinaryUploadReturn = {
  items: UploadItem[];
  addFiles: (files: File[]) => void;
  removeItem: (id: string) => void;
  retryItem: (id: string) => void;
  retryAllFailed: () => void;
  abortAll: () => void;
  clear: () => void;
  isUploading: boolean;
  completedCount: number;
  errorCount: number;
  totalProgress: number;
};

/* ============================================================
 * Client-side validation
 * ============================================================ */

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return `Unsupported format: ${file.type || "unknown"}`;
  }
  if (file.size > MAX_BYTES) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max 5 MB)`;
  }
  return null;
}

/* ============================================================
 * ID generation
 * ============================================================ */

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ============================================================
 * XHR upload with progress
 * ============================================================ */

function uploadWithXhr(
  file: File,
  params: SignUploadResponse,
  onProgress: (progress: number) => void,
  onXhrCreated: (xhr: XMLHttpRequest) => void,
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    onXhrCreated(xhr);

    xhr.open("POST", params.uploadUrl);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText) as {
            secure_url: string;
            public_id: string;
          };
          resolve({ url: json.secure_url, publicId: json.public_id });
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
        return;
      }

      let message = `Upload failed (${xhr.status})`;
      try {
        const err = JSON.parse(xhr.responseText) as {
          error?: { message?: string };
        };
        if (err.error?.message) message = err.error.message;
      } catch {
        // keep default
      }
      reject(new Error(message));
    });

    xhr.addEventListener("error", () =>
      reject(new Error("Network error during upload")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.addEventListener("timeout", () =>
      reject(new Error("Upload timed out")),
    );

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", params.apiKey);
    form.append("timestamp", String(params.timestamp));
    form.append("signature", params.signature);
    form.append("folder", params.folder);
    if (params.publicId) form.append("public_id", params.publicId);
    // Required — this field participates in the signature.
    form.append("allowed_formats", params.allowedFormats);

    xhr.send(form);
  });
}

/* ============================================================
 * Hook
 * ============================================================ */

export function useCloudinaryUpload(
  options: UseCloudinaryUploadOptions,
): UseCloudinaryUploadReturn {
  const {
    entity,
    owner,
    concurrency = 4,
    getPublicId,
    onUploaded,
    onSettled,
  } = options;

  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef<UploadItem[]>([]);

  const commit = useCallback((next: UploadItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const queueRef = useRef<string[]>([]);
  const activeCountRef = useRef(0);
  const xhrMapRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const mountedRef = useRef(true);
  const indexMapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    const xhrMap = xhrMapRef.current;
    const itemsSnapshot = itemsRef.current;

    return () => {
      mountedRef.current = false;
      xhrMap.forEach((xhr) => xhr.abort());
      xhrMap.clear();
      itemsSnapshot.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      if (!mountedRef.current) return;
      const next = itemsRef.current.map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      );
      commit(next);
    },
    [commit],
  );

  const runUpload = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item || !item.file) return;

      patchItem(id, { status: "uploading", progress: 0, error: undefined });

      try {
        const index = indexMapRef.current.get(id) ?? 0;
        const publicId = getPublicId?.(item.file, index);
        const params = await signUpload({ entity, owner, publicId });

        if (!mountedRef.current) return;

        const result = await uploadWithXhr(
          item.file,
          params,
          (progress) => patchItem(id, { progress }),
          (xhr) => xhrMapRef.current.set(id, xhr),
        );

        if (!mountedRef.current) return;

        patchItem(id, { status: "done", progress: 100, result });

        const completed = itemsRef.current.find((it) => it.id === id);
        if (completed) onUploaded?.(completed);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        patchItem(id, { status: "error", error: message });
      } finally {
        xhrMapRef.current.delete(id);
        activeCountRef.current -= 1;
        scheduleNext();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entity, owner, getPublicId, onUploaded, patchItem],
  );

  const scheduleNextRef = useRef<() => void>(() => {});

  const scheduleNext = useCallback(() => {
    while (
      activeCountRef.current < concurrency &&
      queueRef.current.length > 0
    ) {
      const nextId = queueRef.current.shift();
      if (!nextId) break;
      activeCountRef.current += 1;
      void runUpload(nextId);
    }

    const hasPending = itemsRef.current.some(
      (it) => it.status === "pending" || it.status === "uploading",
    );
    if (
      activeCountRef.current === 0 &&
      queueRef.current.length === 0 &&
      !hasPending
    ) {
      onSettled?.(itemsRef.current);
    }
  }, [concurrency, runUpload, onSettled]);

  useEffect(() => {
    scheduleNextRef.current = scheduleNext;
  }, [scheduleNext]);

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const baseIndex = itemsRef.current.length;
      const newItems: UploadItem[] = files.map((file, i) => {
        const id = makeId();
        const previewUrl = URL.createObjectURL(file);
        const error = validateFile(file);

        indexMapRef.current.set(id, baseIndex + i + 1);

        return {
          id,
          file,
          filename: file.name,
          previewUrl,
          status: error ? "error" : "pending",
          progress: 0,
          error: error ?? undefined,
        };
      });

      commit([...itemsRef.current, ...newItems]);

      const validIds = newItems
        .filter((it) => it.status === "pending")
        .map((it) => it.id);

      queueRef.current.push(...validIds);
      scheduleNext();
    },
    [commit, scheduleNext],
  );

  const removeItem = useCallback(
    (id: string) => {
      const xhr = xhrMapRef.current.get(id);
      if (xhr) {
        xhr.abort();
        xhrMapRef.current.delete(id);
      }

      queueRef.current = queueRef.current.filter((qid) => qid !== id);

      const item = itemsRef.current.find((it) => it.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);

      indexMapRef.current.delete(id);

      commit(itemsRef.current.filter((it) => it.id !== id));
    },
    [commit],
  );

  const retryItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item) return;

      patchItem(id, {
        status: "pending",
        progress: 0,
        error: undefined,
      });

      queueRef.current.push(id);
      scheduleNext();
    },
    [patchItem, scheduleNext],
  );

  const retryAllFailed = useCallback(() => {
    const failedIds = itemsRef.current
      .filter(
        (it) => it.status === "error" && !it.error?.startsWith("Unsupported"),
      )
      .filter((it) => !it.error?.startsWith("File too large"))
      .map((it) => it.id);

    if (failedIds.length === 0) return;

    failedIds.forEach((id) =>
      patchItem(id, { status: "pending", progress: 0, error: undefined }),
    );

    queueRef.current.push(...failedIds);
    scheduleNext();
  }, [patchItem, scheduleNext]);

  const abortAll = useCallback(() => {
    queueRef.current = [];

    xhrMapRef.current.forEach((xhr) => xhr.abort());
    xhrMapRef.current.clear();
    activeCountRef.current = 0;

    const next = itemsRef.current.map((it) =>
      it.status === "uploading" || it.status === "pending"
        ? { ...it, status: "error" as const, error: "Cancelled" }
        : it,
    );
    commit(next);
  }, [commit]);

  const clear = useCallback(() => {
    xhrMapRef.current.forEach((xhr) => xhr.abort());
    xhrMapRef.current.clear();
    queueRef.current = [];
    activeCountRef.current = 0;

    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    indexMapRef.current.clear();

    commit([]);
  }, [commit]);

  const isUploading = useMemo(
    () =>
      items.some((it) => it.status === "uploading" || it.status === "pending"),
    [items],
  );

  const completedCount = useMemo(
    () => items.filter((it) => it.status === "done").length,
    [items],
  );

  const errorCount = useMemo(
    () => items.filter((it) => it.status === "error").length,
    [items],
  );

  const totalProgress = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, it) => {
      if (it.status === "done") return acc + 100;
      return acc + it.progress;
    }, 0);
    return Math.round(sum / items.length);
  }, [items]);

  return {
    items,
    addFiles,
    removeItem,
    retryItem,
    retryAllFailed,
    abortAll,
    clear,
    isUploading,
    completedCount,
    errorCount,
    totalProgress,
  };
}
