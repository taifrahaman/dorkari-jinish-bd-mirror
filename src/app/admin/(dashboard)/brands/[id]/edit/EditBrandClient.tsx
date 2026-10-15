// src/app/admin/(dashboard)/brands/[id]/edit/EditBrandClient.tsx

"use client";

import { Loader2 } from "lucide-react";
import { BrandForm } from "@/components/admin/brand";
import { useBrand } from "@/hooks/admin";

export function EditBrandClient({ id }: { id: string }) {
  const { data: brand, isLoading, error } = useBrand(id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading brand…
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Brand not found.
      </div>
    );
  }

  return <BrandForm brand={brand} />;
}
