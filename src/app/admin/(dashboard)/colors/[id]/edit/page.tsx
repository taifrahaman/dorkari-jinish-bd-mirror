// src/app/admin/(dashboard)/colors/[id]/edit/page.tsx

"use client";

import { use } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { ColorForm } from "@/components/admin/color";
import { useColor } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditColorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const colorQuery = useColor(id);

  if (colorQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
        </div>

        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-lg border border-brand-border bg-brand-surface p-6"
          >
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-5 md:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (colorQuery.isError || !colorQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/admin/colors"
          title="Color not found"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Colors", href: "/admin/colors" },
            { label: "Not found" },
          ]}
        />

        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {colorQuery.error instanceof Error
            ? colorQuery.error.message
            : "Failed to load this color."}
        </div>
      </div>
    );
  }

  const color = colorQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/colors"
        title={`Edit: ${color.name.en}`}
        description={color.hex}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Colors", href: "/admin/colors" },
          { label: color.name.en },
        ]}
      />

      <ColorForm color={color} />
    </div>
  );
}
