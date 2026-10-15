// src/components/admin/media/MediaDetailDrawer.tsx

"use client";

import Link from "next/link";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { MediaAsset, UsageRef } from "@/services/media.service";

export type MediaDetailDrawerProps = {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestDelete?: (asset: MediaAsset) => void;
};

export function MediaDetailDrawer({
  asset,
  open,
  onOpenChange,
  onRequestDelete,
}: MediaDetailDrawerProps) {
  if (!asset) return null;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(asset.url);
      toast.success("URL copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b border-brand-border px-5 py-4">
          <SheetTitle className="text-sm font-mono truncate">
            {asset.publicId.split("/").pop() ?? asset.publicId}
          </SheetTitle>
          <SheetDescription className="sr-only">Image details</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-5 p-5">
            {/* Preview */}
            <div className="overflow-hidden rounded-md border border-brand-border bg-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.publicId}
                className="h-auto w-full object-contain"
              />
            </div>

            {/* Meta grid */}
            <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-xs">
              <Dt>Size</Dt>
              <Dd>
                {asset.width} × {asset.height}
              </Dd>

              <Dt>Format</Dt>
              <Dd className="uppercase">{asset.format}</Dd>

              <Dt>File size</Dt>
              <Dd>{formatBytes(asset.bytes)}</Dd>

              <Dt>Uploaded</Dt>
              <Dd>{new Date(asset.createdAt).toLocaleString()}</Dd>

              <Dt>Type</Dt>
              <Dd className="capitalize">{asset.entity}</Dd>
            </dl>

            <Separator />

            {/* Usage */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                {asset.used ? "Used by" : "Not used anywhere"}
              </h3>

              {asset.used ? (
                <ul className="space-y-1.5">
                  {asset.usedBy.map((ref) => (
                    <UsageRow key={`${ref.kind}-${ref.id}`} ref_={ref} />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-amber-700">
                  Safe to delete — no product, category, or brand points to this
                  image.
                </p>
              )}
            </div>

            <Separator />

            {/* Public ID */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
                Public ID
              </h3>
              <code className="block break-all rounded bg-muted/50 px-2 py-1.5 text-[11px] text-brand-text-secondary">
                {asset.publicId}
              </code>
            </div>
          </div>
        </ScrollArea>

        {/* Footer actions */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-2 border-t border-brand-border bg-brand-surface px-5 py-3">
          <Button variant="outline" size="sm" onClick={copyUrl}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy URL
          </Button>

          {onRequestDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRequestDelete(asset)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================
 * Rows
 * ============================================================ */

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-brand-text-secondary">{children}</dt>;
}

function Dd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <dd className={`text-brand-primary ${className ?? ""}`}>{children}</dd>
  );
}

function UsageRow({ ref_ }: { ref_: UsageRef }) {
  const href =
    ref_.kind === "product"
      ? `/admin/products/${ref_.id}`
      : ref_.kind === "category"
        ? `/admin/categories/${ref_.id}/edit`
        : `/admin/brands/${ref_.id}/edit`;

  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between rounded border border-brand-border bg-muted/20 px-2.5 py-1.5 text-xs transition-colors hover:border-brand-accent/60 hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <span className="rounded bg-brand-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-text-secondary">
            {ref_.kind}
          </span>
          <span className="truncate text-brand-primary">{ref_.name}</span>
        </span>
        <ExternalLink className="h-3 w-3 shrink-0 text-brand-text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
    </li>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
