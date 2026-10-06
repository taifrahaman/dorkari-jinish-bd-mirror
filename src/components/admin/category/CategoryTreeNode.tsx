// src/components/admin/category/CategoryTreeNode.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  FolderTree,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { CategoryTreeNode as CategoryTreeNodeType } from "@/lib/validations/category.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CategoryTreeNodeActions = {
  onArchive: (node: CategoryTreeNodeType) => void;
  onRestore: (node: CategoryTreeNodeType) => void;
  onPermanentDelete: (node: CategoryTreeNodeType) => void;
};

export type CategoryTreeNodeProps = {
  node: CategoryTreeNodeType;
  depth: number;
  actions: CategoryTreeNodeActions;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function countDescendants(node: CategoryTreeNodeType): number {
  let count = 0;
  for (const child of node.children ?? []) {
    count += 1 + countDescendants(child);
  }
  return count;
}

function countProducts(node: CategoryTreeNodeType): number {
  let count = node.productCount ?? 0;
  for (const child of node.children ?? []) {
    count += countProducts(child);
  }
  return count;
}

/* ============================================================
 * Component
 * ============================================================ */

export function CategoryTreeNode({
  node,
  depth,
  actions,
}: CategoryTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);

  const hasChildren = (node.children?.length ?? 0) > 0;
  const archived = Boolean(node.deletedAt);
  const descendantCount = countDescendants(node);
  const productCount = countProducts(node);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-brand-border hover:bg-muted/40",
          archived && "opacity-70",
        )}
        style={{ paddingLeft: `${8 + depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="grid h-5 w-5 shrink-0 place-items-center rounded text-brand-text-secondary transition-colors hover:bg-muted hover:text-brand-primary"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded && "rotate-90",
              )}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}

        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-brand-border bg-muted">
          {node.image ? (
            <img
              src={node.image.url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-brand-text-secondary">
              <FolderTree className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/categories/${node._id}/edit`}
              className="truncate text-sm font-medium text-brand-primary hover:underline"
            >
              {node.name.en}
            </Link>

            {node.name.bn && node.name.bn !== node.name.en && (
              <span className="truncate text-xs text-brand-text-secondary">
                {node.name.bn}
              </span>
            )}

            {archived && (
              <Badge
                variant="outline"
                className="border-brand-border text-[10px] text-brand-text-secondary"
              >
                Archived
              </Badge>
            )}

            {!archived && !node.isActive && (
              <Badge
                variant="outline"
                className="border-brand-border text-[10px] text-brand-text-secondary"
              >
                Inactive
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-brand-text-secondary">
            <span className="font-mono">{node.slug}</span>

            {productCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {productCount} product{productCount === 1 ? "" : "s"}
                </span>
              </>
            )}

            {hasChildren && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {node.children.length} child
                  {node.children.length === 1 ? "" : "ren"}
                  {descendantCount > node.children.length && (
                    <> ({descendantCount} total)</>
                  )}
                </span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                aria-label="Row actions"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {/* Plain heading — Base UI's Menu.GroupLabel requires a
                Menu.Group wrapper. This is not an interactive item,
                so a styled div is the correct primitive. */}
            <div className="truncate px-2 py-1.5 text-xs font-medium text-brand-text-secondary">
              {node.name.en}
            </div>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href={`/admin/categories/${node._id}/edit`} />}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </DropdownMenuItem>

            {!archived && (
              <DropdownMenuItem onClick={() => actions.onArchive(node)}>
                <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Archive
              </DropdownMenuItem>
            )}

            {archived && (
              <DropdownMenuItem onClick={() => actions.onRestore(node)}>
                <ArchiveRestore
                  className="mr-2 h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Restore
              </DropdownMenuItem>
            )}

            {archived && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onPermanentDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Delete forever
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              actions={actions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryTreeNode;
