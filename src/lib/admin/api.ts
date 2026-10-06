// src/lib/admin/api.ts

import type {
  ApiResponse,
  BulkResult,
  Paginated,
} from "@/lib/validations/common.schema";
import type {
  CreateCategoryInput,
  CategoryResponse,
  CategoryListQuery,
  CategoryTreeNode,
  UpdateCategoryInput,
} from "@/lib/validations/category.schema";
import type {
  CreateProductInput,
  ProductResponse,
  ProductListQuery,
  UpdateProductInput,
} from "@/lib/validations/product.schema";
import type {
  CreateColorInput,
  ColorResponse,
  ColorListQuery,
  UpdateColorInput,
} from "@/lib/validations/color.schema";
import type {
  BulkCreateProductInput,
  ImportPayload,
  ImportResult,
  ExportFormat,
} from "@/lib/validations/import.schema";
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderListQuery,
  OrderResponse,
} from "@/lib/validations/order.schema";

/* ============================================================
 * Spec suggestion type
 * ============================================================ */

export type SpecSuggestion = {
  key: string;
  usageCount: number;
  exampleValue?: string;
};

/* ============================================================
 * Product stats types (mirrors product-stats.service.ts)
 * ============================================================ */

export type ProductStatsRange = "7d" | "30d" | "90d" | "1y" | "all";

export type ProductStatsTotals = {
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  averagePrice: number;
  orderCount: number;
};

export type ProductStatsBucket = {
  date: string;
  unitsSold: number;
  revenue: number;
  profit: number;
};

export type ProductRecentOrderRow = {
  orderId: string;
  orderNumber: string;
  channel: "online" | "pos" | "phone" | "walk-in";
  status: string;
  paymentStatus: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  orderDate: string;
};

export type ProductStats = {
  productId: string;
  range: ProductStatsRange;
  from: string | null;
  to: string;
  current: {
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    marginPerUnit: number | null;
    marginPercent: number | null;
    stock: number;
    lowStockThreshold: number | null;
    stockValue: number | null;
    potentialRevenue: number | null;
  };
  totals: ProductStatsTotals;
  buckets: ProductStatsBucket[];
  bucketGranularity: "daily" | "monthly";
  recentOrders: ProductRecentOrderRow[];
};

/* ============================================================
 * Order stats types (mirrors order.service.ts getOrderStats)
 * ============================================================ */

export type OrderStatsRange = "today" | "7d" | "30d" | "all";

export type OrderChannel = "online" | "pos" | "phone" | "walk-in";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type PaymentStatus =
  "pending" | "partial" | "paid" | "failed" | "refunded";

export type OrderStats = {
  range: OrderStatsRange;
  from: string | null;
  to: string;
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
  byChannel: Record<OrderChannel, number>;
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
};

/* ============================================================
 * Error type
 * ============================================================ */

export class AdminApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AdminApiError.prototype);
  }

  getFieldErrors(): Record<string, string[]> | null {
    if (!this.details || typeof this.details !== "object") return null;
    const d = this.details as { fieldErrors?: unknown };
    if (!d.fieldErrors || typeof d.fieldErrors !== "object") return null;
    return d.fieldErrors as Record<string, string[]>;
  }
}

/* ============================================================
 * Abort detection
 * ============================================================ */

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
}

function swallowAbort<T>(): Promise<T> {
  return new Promise<T>(() => {
    /* intentionally never resolves */
  });
}

/* ============================================================
 * Request options
 * ============================================================ */

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, unknown>;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

/* ============================================================
 * Core request
 * ============================================================ */

const API_BASE = "/api/admin";

export async function adminRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal, headers } = options;

  const url = buildUrl(path, query);

  const init: RequestInit = {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    credentials: "same-origin",
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if (isAbortError(err)) return swallowAbort<T>();
    throw new AdminApiError(
      "Network error — could not reach the server.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let text: string;
  try {
    text = await res.text();
  } catch (err) {
    if (isAbortError(err)) return swallowAbort<T>();
    throw new AdminApiError(
      "Failed to read response body.",
      res.status,
      "BODY_READ_ERROR",
    );
  }

  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new AdminApiError(
      `Invalid JSON response from ${path}`,
      res.status,
      "INVALID_JSON",
      { raw: text.slice(0, 200) },
    );
  }

  const envelope = json as ApiResponse<T>;

  if (!res.ok || envelope.success === false) {
    const failure = envelope.success === false ? envelope.error : null;
    throw new AdminApiError(
      failure?.message ?? `Request failed with status ${res.status}`,
      res.status,
      failure?.code,
      failure?.details,
    );
  }

  if (!("data" in envelope)) {
    throw new AdminApiError(
      "Malformed API response: missing `data` field",
      res.status,
      "MALFORMED_RESPONSE",
    );
  }

  return envelope.data;
}

/* ============================================================
 * URL builder
 * ============================================================ */

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const base = `${API_BASE}${path}`;
  if (!query) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else if (typeof value === "boolean") {
      params.set(key, value ? "true" : "false");
    } else {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/* ============================================================
 * Blob download
 * ============================================================ */

export type DownloadResult = {
  blob: Blob;
  filename: string;
};

export async function adminDownload(
  path: string,
  options: RequestOptions = {},
): Promise<DownloadResult> {
  const { query, signal } = options;
  const url = buildUrl(path, query);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      signal,
      credentials: "same-origin",
    });
  } catch (err) {
    if (isAbortError(err)) return swallowAbort<DownloadResult>();
    throw new AdminApiError(
      "Network error — could not reach the server.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    let code: string | undefined;
    try {
      const json = (await res.json()) as ApiResponse<never>;
      if (json.success === false) {
        message = json.error.message;
        code = json.error.code;
      }
    } catch {
      // keep generic
    }
    throw new AdminApiError(message, res.status, code);
  }

  let blob: Blob;
  try {
    blob = await res.blob();
  } catch (err) {
    if (isAbortError(err)) return swallowAbort<DownloadResult>();
    throw new AdminApiError(
      "Failed to read download body.",
      res.status,
      "BODY_READ_ERROR",
    );
  }

  const filename = extractFilename(res, path);
  return { blob, filename };
}

function extractFilename(res: Response, fallbackPath: string): string {
  const cd = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  if (match && match[1]) return decodeURIComponent(match[1]);

  const ext = fallbackPath.includes("format=json") ? "json" : "csv";
  return `export.${ext}`;
}

/* ============================================================
 * Cloudinary signature
 * ============================================================ */

export type SignUploadRequest = {
  entity: "products" | "categories" | "tmp";
  owner: string;
  publicId?: string;
};

export type SignUploadResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId?: string;
  allowedFormats: string;
  maxBytes: number;
  expiresIn: number;
  uploadUrl: string;
};

export function signUpload(
  input: SignUploadRequest,
  signal?: AbortSignal,
): Promise<SignUploadResponse> {
  return adminRequest<SignUploadResponse>("/cloudinary/sign", {
    method: "POST",
    body: input,
    signal,
  });
}

/* ============================================================
 * Categories API
 * ============================================================ */

export const categoriesApi = {
  list(
    params: Partial<CategoryListQuery> = {},
    signal?: AbortSignal,
  ): Promise<Paginated<CategoryResponse>> {
    return adminRequest<Paginated<CategoryResponse>>("/categories", {
      query: params,
      signal,
    });
  },

  tree(signal?: AbortSignal): Promise<CategoryTreeNode[]> {
    return adminRequest<CategoryTreeNode[]>("/categories/tree", { signal });
  },

  treeWithOptions(
    options: { includeDeleted?: boolean; includeInactive?: boolean } = {},
    signal?: AbortSignal,
  ): Promise<CategoryTreeNode[]> {
    return adminRequest<CategoryTreeNode[]>("/categories/tree", {
      query: {
        includeDeleted: options.includeDeleted,
        includeInactive: options.includeInactive,
      },
      signal,
    });
  },

  suggest(
    q: string,
    limit = 10,
    signal?: AbortSignal,
  ): Promise<CategoryResponse[]> {
    return adminRequest<CategoryResponse[]>("/categories/suggest", {
      query: { q, limit },
      signal,
    });
  },

  get(id: string, signal?: AbortSignal): Promise<CategoryResponse> {
    return adminRequest<CategoryResponse>(`/categories/${id}`, { signal });
  },

  create(input: CreateCategoryInput): Promise<CategoryResponse> {
    return adminRequest<CategoryResponse>("/categories", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: UpdateCategoryInput): Promise<CategoryResponse> {
    return adminRequest<CategoryResponse>(`/categories/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  archive(id: string): Promise<{ _id: string }> {
    return adminRequest<{ _id: string }>(`/categories/${id}`, {
      method: "DELETE",
    });
  },

  restore(id: string): Promise<CategoryResponse> {
    return adminRequest<CategoryResponse>(`/categories/${id}/restore`, {
      method: "POST",
    });
  },

  permanentDelete(id: string): Promise<{ _id: string; deleted: true }> {
    return adminRequest<{ _id: string; deleted: true }>(
      `/categories/${id}/permanent`,
      { method: "DELETE" },
    );
  },
};

/* ============================================================
 * Products API
 * ============================================================ */

export const productsApi = {
  list(
    params: Partial<ProductListQuery> = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ProductResponse>> {
    return adminRequest<Paginated<ProductResponse>>("/products", {
      query: params,
      signal,
    });
  },

  get(id: string, signal?: AbortSignal): Promise<ProductResponse> {
    return adminRequest<ProductResponse>(`/products/${id}`, { signal });
  },

  stats(
    id: string,
    range: ProductStatsRange = "30d",
    signal?: AbortSignal,
  ): Promise<ProductStats> {
    return adminRequest<ProductStats>(`/products/${id}/stats`, {
      query: { range },
      signal,
    });
  },

  create(input: CreateProductInput): Promise<ProductResponse> {
    return adminRequest<ProductResponse>("/products", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: UpdateProductInput): Promise<ProductResponse> {
    return adminRequest<ProductResponse>(`/products/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  archive(id: string): Promise<{ _id: string }> {
    return adminRequest<{ _id: string }>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  restore(id: string): Promise<ProductResponse> {
    return adminRequest<ProductResponse>(`/products/${id}/restore`, {
      method: "POST",
    });
  },

  permanentDelete(id: string): Promise<{ _id: string; deleted: true }> {
    return adminRequest<{ _id: string; deleted: true }>(
      `/products/${id}/permanent`,
      { method: "DELETE" },
    );
  },

  bulkCreate(input: BulkCreateProductInput): Promise<BulkResult> {
    return adminRequest<BulkResult>("/products/bulk", {
      method: "POST",
      body: input,
    });
  },

  import(input: ImportPayload): Promise<ImportResult> {
    return adminRequest<ImportResult>("/products/import", {
      method: "POST",
      body: input,
    });
  },

  export(
    format: ExportFormat,
    params: {
      category?: string;
      isActive?: boolean;
      includeDeleted?: boolean;
      ids?: string[];
    } = {},
  ): Promise<DownloadResult> {
    return adminDownload("/products/export", {
      query: { format, ...params },
    });
  },

  specSuggestions(
    q: string,
    category?: string,
    signal?: AbortSignal,
  ): Promise<SpecSuggestion[]> {
    return adminRequest<SpecSuggestion[]>("/products/spec-suggestions", {
      query: { q, category },
      signal,
    });
  },
};

/* ============================================================
 * Orders API
 * ============================================================ */

export const ordersApi = {
  list(
    params: Partial<OrderListQuery> = {},
    signal?: AbortSignal,
  ): Promise<Paginated<OrderResponse>> {
    return adminRequest<Paginated<OrderResponse>>("/orders", {
      query: params,
      signal,
    });
  },

  get(id: string, signal?: AbortSignal): Promise<OrderResponse> {
    return adminRequest<OrderResponse>(`/orders/${id}`, { signal });
  },

  stats(
    range: OrderStatsRange = "30d",
    signal?: AbortSignal,
  ): Promise<OrderStats> {
    return adminRequest<OrderStats>("/orders/stats", {
      query: { range },
      signal,
    });
  },

  create(input: CreateOrderInput): Promise<OrderResponse> {
    return adminRequest<OrderResponse>("/orders", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: UpdateOrderInput): Promise<OrderResponse> {
    return adminRequest<OrderResponse>(`/orders/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  archive(id: string): Promise<{ _id: string }> {
    return adminRequest<{ _id: string }>(`/orders/${id}`, {
      method: "DELETE",
    });
  },
};

/* ============================================================
 * Colors API
 * ============================================================ */

export const colorsApi = {
  list(
    params: Partial<ColorListQuery> = {},
    signal?: AbortSignal,
  ): Promise<Paginated<ColorResponse>> {
    return adminRequest<Paginated<ColorResponse>>("/colors", {
      query: params,
      signal,
    });
  },

  suggest(
    q: string,
    limit = 15,
    signal?: AbortSignal,
  ): Promise<ColorResponse[]> {
    return adminRequest<ColorResponse[]>("/colors/suggest", {
      query: { q, limit },
      signal,
    });
  },

  get(id: string, signal?: AbortSignal): Promise<ColorResponse> {
    return adminRequest<ColorResponse>(`/colors/${id}`, { signal });
  },

  create(input: CreateColorInput): Promise<ColorResponse> {
    return adminRequest<ColorResponse>("/colors", {
      method: "POST",
      body: input,
    });
  },

  update(id: string, input: UpdateColorInput): Promise<ColorResponse> {
    return adminRequest<ColorResponse>(`/colors/${id}`, {
      method: "PATCH",
      body: input,
    });
  },

  delete(id: string): Promise<{ _id: string }> {
    return adminRequest<{ _id: string }>(`/colors/${id}`, {
      method: "DELETE",
    });
  },
};

/* ============================================================
 * Browser download
 * ============================================================ */

export function saveBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") {
    throw new Error("saveBlob() is browser-only");
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
