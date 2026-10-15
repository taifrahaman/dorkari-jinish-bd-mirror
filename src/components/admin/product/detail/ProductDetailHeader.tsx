// src/components/admin/product/detail/ProductDetailHeader.tsx

"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, Copy, Pencil, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductDetailHeaderProps = {
  product: ProductResponse;
  onArchive?: () => void;
  onRestore?: () => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function getCategoryLabel(product: ProductResponse): string | null {
  const cat = product.category;
  if (!cat || typeof cat === "string") return null;
  return cat.name;
}

type BrandRef = { _id: string; name: string; slug: string } | null;

function getBrandRef(product: ProductResponse): BrandRef {
  const b = product.brand;
  if (!b) return null;
  if (typeof b === "string") return null;
  return { _id: b._id, name: b.name, slug: b.slug };
}

/* ============================================================
 * Component
 * ============================================================ */

export function ProductDetailHeader({
  product,
  onArchive,
  onRestore,
}: ProductDetailHeaderProps) {
  const archived = Boolean(product.deletedAt);
  const category = getCategoryLabel(product);
  const brand = getBrandRef(product);

  const copySku = async () => {
    if (!product.sku) return;
    try {
      await navigator.clipboard.writeText(product.sku);
    } catch {
      // ignore
    }
  };

  return (
    <PageHeader
      backHref="/admin/products"
      title={product.name.en}
      description={product.name.bn}
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Products", href: "/admin/products" },
        { label: product.name.en },
      ]}
      actions={
        <>
          {!archived && (
            <Link
              href={`/admin/products/${product._id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          )}

          {archived && onRestore && (
            <Button type="button" variant="outline" onClick={onRestore}>
              <ArchiveRestore className="mr-2 h-4 w-4" aria-hidden="true" />
              Restore
            </Button>
          )}

          {!archived && onArchive && (
            <Button type="button" variant="outline" onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
              Archive
            </Button>
          )}
        </>
      }
    >
      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-2">
        {archived ? (
          <Badge
            variant="outline"
            className="border-brand-border text-brand-text-secondary"
          >
            Archived
          </Badge>
        ) : product.isActive ? (
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-700"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-brand-border text-brand-text-secondary"
          >
            Draft
          </Badge>
        )}

        {product.isFeatured && (
          <Badge
            variant="outline"
            className="border-brand-accent/40 bg-brand-accent-light text-brand-primary"
          >
            ★ Featured
          </Badge>
        )}

        {product.sku && (
          <button
            type="button"
            onClick={copySku}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs font-mono tabular-nums text-brand-text-secondary transition-colors hover:bg-muted"
            title="Click to copy"
          >
            {product.sku}
            <Copy className="h-3 w-3 opacity-60" aria-hidden="true" />
          </button>
        )}

        {product.barcode && (
          <span className="inline-flex items-center rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs font-mono tabular-nums text-brand-text-secondary">
            {product.barcode}
          </span>
        )}

        {category && (
          <span className="inline-flex items-center rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs text-brand-text-secondary">
            {category}
          </span>
        )}

        {brand && (
          <Link
            href={`/admin/brands/${brand._id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs text-brand-text-secondary transition-colors hover:bg-muted hover:text-brand-primary"
            title="View brand"
          >
            <Tag className="h-3 w-3 opacity-70" aria-hidden="true" />
            {brand.name}
          </Link>
        )}
      </div>
    </PageHeader>
  );
}

export default ProductDetailHeader;
