// src/components/admin/product/ProductForm.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  CategoryCombobox,
  type CategoryOption,
} from "@/components/admin/category-combobox/CategoryCombobox";
import { BrandCombobox } from "@/components/admin/brand-combobox/BrandCombobox";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ColorMultiSelect } from "@/components/admin/color";
import { SpecificationEditor } from "./SpecificationEditor";
import { AdminApiError } from "@/lib/admin/api";
import { createProductSchema } from "@/lib/validations/product.schema";
import type { ProductResponse } from "@/lib/validations/product.schema";
import type { ImageRef } from "@/services/cloudinary.service";
import { formatPrice } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import { useCreateProduct, useUpdateProduct } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof createProductSchema>;
type FormOutput = z.output<typeof createProductSchema>;

export type ProductFormProps = {
  product?: ProductResponse;
  categories: CategoryOption[];
};

/* ============================================================
 * Defaults
 * ============================================================ */

const CREATE_DEFAULTS: FormInput = {
  name: { en: "", bn: "" },
  slug: undefined,
  description: { en: "", bn: "" },
  price: 0,
  compareAtPrice: undefined,
  costPrice: undefined,
  taxRate: 0,
  category: "",
  brand: undefined,
  stock: 0,
  lowStockThreshold: undefined,
  images: [],
  colors: [],
  sku: undefined,
  barcode: undefined,
  weight: undefined,
  dimensions: undefined,
  specifications: {},
  supplier: undefined,
  isActive: true,
  isFeatured: false,
};

function buildDefaults(product?: ProductResponse): FormInput {
  if (!product) return CREATE_DEFAULTS;

  const categoryId =
    typeof product.category === "string"
      ? product.category
      : product.category._id;

  const brandId =
    typeof product.brand === "string"
      ? product.brand
      : product.brand && typeof product.brand === "object"
        ? product.brand._id
        : undefined;

  return {
    name: product.name,
    slug: product.slug,
    description: {
      en: product.description?.en ?? "",
      bn: product.description?.bn ?? "",
    },
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    costPrice: product.costPrice ?? undefined,
    taxRate: product.taxRate ?? 0,
    category: categoryId,
    brand: brandId,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    images: product.images,
    colors: product.colors ?? [],
    sku: product.sku,
    barcode: product.barcode,
    weight: product.weight,
    dimensions: product.dimensions,
    specifications: (product.specifications as Record<string, string>) ?? {},
    supplier: product.supplier,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };
}

/* ============================================================
 * Numeric coercion for optional number inputs
 * ============================================================ */

const optionalNumber = {
  setValueAs: (v: unknown) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? undefined : n;
  },
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?._id ?? "");

  const isPending = createMutation.isPending || updateMutation.isPending;

  /* Lazy init — stable across renders, avoids Math.random in render body */
  const [draftId] = useState(
    () => `draft-${Math.random().toString(36).slice(2, 10)}`,
  );
  const draftOwner = product?.sku ?? draftId;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: buildDefaults(product),
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
    watch,
    setValue,
  } = form;

  useEffect(() => {
    if (product) reset(buildDefaults(product));
  }, [product, reset]);

  /* ----------------------------------------------------------
   * Live margin preview
   * ---------------------------------------------------------- */

  const livePrice = watch("price");
  const liveCost = watch("costPrice");

  const marginLine = useMemo(() => {
    const p = typeof livePrice === "number" ? livePrice : Number(livePrice);
    const c = typeof liveCost === "number" ? liveCost : Number(liveCost);

    if (!Number.isFinite(p) || !Number.isFinite(c) || c <= 0 || p <= 0) {
      return null;
    }

    const margin = p - c;
    const pct = (margin / p) * 100;
    return {
      margin,
      pct,
      positive: margin > 0,
    };
  }, [livePrice, liveCost]);

  /* ----------------------------------------------------------
   * Submit
   * ---------------------------------------------------------- */

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && product) {
        // Edit: stay on this page. The mutation invalidates the query
        // cache and useProduct re-fetches — form re-hydrates with
        // fresh data. No redirect, no refresh.
        await updateMutation.mutateAsync(values);
      } else {
        // Create: navigate back to the products list.
        await createMutation.mutateAsync(values);
        router.push("/admin/products");
        router.refresh();
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        const fieldErrors = err.getFieldErrors();
        if (fieldErrors) {
          for (const [path, messages] of Object.entries(fieldErrors)) {
            setError(path as keyof FormInput, {
              type: "server",
              message: messages[0],
            });
          }
        }
      }
    }
  });

  const currentCategoryId = watch("category");

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* ------------------------------------------------------
       * Basic information
       * ------------------------------------------------------ */}
      <Section
        title="Basic information"
        description="Product name, slug, SKU, and barcode."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Name (English)"
            required
            error={errors.name?.en?.message}
          >
            <Input
              {...register("name.en")}
              placeholder="Samsung 1.5 Ton Inverter AC"
              autoComplete="off"
            />
          </Field>

          <Field label="Name (বাংলা)" required error={errors.name?.bn?.message}>
            <Input
              {...register("name.bn")}
              placeholder="স্যামসাং ১.৫ টন ইনভার্টার এসি"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Slug"
            hint="Leave blank to auto-generate from the English name."
            error={errors.slug?.message}
          >
            <Input
              {...register("slug")}
              placeholder="samsung-1-5-ton-inverter-ac"
              autoComplete="off"
            />
          </Field>

          <Field
            label="SKU"
            hint="Leave blank to auto-generate (DJ-YYYY-NNNN)."
            error={errors.sku?.message}
          >
            <Input
              {...register("sku")}
              placeholder="DJ-2026-0001"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Barcode"
            hint="Optional. Must be unique — used for POS scanning."
            error={errors.barcode?.message}
          >
            <Input
              {...register("barcode")}
              placeholder="8801234567890"
              className="font-mono"
              autoComplete="off"
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Pricing, cost & stock
       * ------------------------------------------------------ */}
      <Section
        title="Pricing, cost & stock"
        description="Selling price, buying cost, and inventory level."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            label="Selling price (BDT)"
            required
            error={errors.price?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("price", { valueAsNumber: true })}
              placeholder="65000"
            />
          </Field>

          <Field
            label="Compare at price"
            hint="Shown struck-through when set."
            error={errors.compareAtPrice?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("compareAtPrice", optionalNumber)}
              placeholder="72000"
            />
          </Field>

          <Field
            label="Cost price (buying)"
            hint="What you paid. Used for profit tracking."
            error={errors.costPrice?.message}
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register("costPrice", optionalNumber)}
              placeholder="55000"
            />
          </Field>
        </div>

        {marginLine && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-xs",
              marginLine.positive
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            Margin per unit:{" "}
            <strong className="tabular-nums">
              {formatPrice(marginLine.margin)}
            </strong>{" "}
            ({marginLine.pct.toFixed(1)}%)
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Stock quantity" required error={errors.stock?.message}>
            <Input
              type="number"
              min="0"
              {...register("stock", { valueAsNumber: true })}
              placeholder="8"
            />
          </Field>

          <Field
            label="Low stock alert at"
            hint="Overrides the default of 5."
            error={errors.lowStockThreshold?.message}
          >
            <Input
              type="number"
              min="0"
              {...register("lowStockThreshold", optionalNumber)}
              placeholder="5"
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Organization
       * ------------------------------------------------------ */}
      <Section
        title="Organization"
        description="Category, brand, and visibility settings."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Category" required error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <CategoryCombobox
                  value={field.value || undefined}
                  onChange={(id) => field.onChange(id ?? "")}
                  initialCategories={categories}
                  allowCreate
                  placeholder="Select category…"
                />
              )}
            />
          </Field>

          <Field
            label="Brand"
            hint="Optional. Leave blank for unbranded products."
            error={errors.brand?.message}
          >
            <Controller
              control={control}
              name="brand"
              render={({ field }) => (
                <BrandCombobox
                  value={field.value || undefined}
                  onChange={(id) => field.onChange(id ?? undefined)}
                  allowCreate
                  placeholder="Select brand…"
                />
              )}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <ToggleRow
                label="Active"
                description="Visible on the storefront."
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <ToggleRow
                label="Featured"
                description="Highlight on the homepage."
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Descriptions
       * ------------------------------------------------------ */}
      <Section
        title="Descriptions"
        description="Shown on the product detail page."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Description (English)"
            error={errors.description?.en?.message}
          >
            <Textarea
              {...register("description.en")}
              rows={5}
              placeholder="Energy-efficient split AC with 5-star rating, dual inverter compressor, and 10-year warranty on the compressor."
            />
          </Field>

          <Field
            label="Description (বাংলা)"
            error={errors.description?.bn?.message}
          >
            <Textarea
              {...register("description.bn")}
              rows={5}
              placeholder="৫ স্টার রেটিং সহ এনার্জি-এফিশিয়েন্ট স্প্লিট এসি, ডুয়াল ইনভার্টার কম্প্রেসর এবং কম্প্রেসরে ১০ বছরের ওয়ারেন্টি।"
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Shipping
       * ------------------------------------------------------ */}
      <Section title="Shipping" description="Weight and dimensions (optional).">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Weight" error={errors.weight?.message}>
            <Input {...register("weight")} placeholder="42kg" />
          </Field>
          <Field label="Dimensions" error={errors.dimensions?.message}>
            <Input {...register("dimensions")} placeholder="100 × 35 × 25 cm" />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Images
       * ------------------------------------------------------ */}
      <Section
        title="Images"
        description="First image is the main image. Drag the handle to reorder."
      >
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader
              entity="products"
              owner={draftOwner}
              value={(field.value as ImageRef[] | undefined) ?? []}
              onChange={field.onChange}
              maxImages={10}
            />
          )}
        />
      </Section>

      {/* ------------------------------------------------------
       * Colors
       * ------------------------------------------------------ */}
      <Section
        title="Colors"
        description="Pick from the shared library, or add a custom color."
      >
        <Controller
          control={control}
          name="colors"
          render={({ field }) => (
            <ColorMultiSelect
              value={field.value ?? []}
              onChange={field.onChange}
              imageUrls={(watch("images") ?? [])
                .map((i) => i.url)
                .filter(Boolean)}
              maxColors={12}
            />
          )}
        />
      </Section>

      {/* ------------------------------------------------------
       * Specifications
       * ------------------------------------------------------ */}
      <Section
        title="Specifications"
        description="Type a key to see suggestions from existing products."
      >
        <SpecificationEditor
          value={watch("specifications") ?? {}}
          onChange={(next) =>
            setValue("specifications", next, { shouldDirty: true })
          }
          categoryId={currentCategoryId || undefined}
        />
      </Section>

      {/* ------------------------------------------------------
       * Supplier
       * ------------------------------------------------------ */}
      <Section
        title="Supplier (optional)"
        description="Leave every field blank to skip. If you fill any field, the supplier name is required."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Supplier name"
            hint="Required only if you fill any other supplier field."
            error={errors.supplier?.name?.message}
          >
            <Input
              {...register("supplier.name")}
              placeholder="Walton Plaza"
              autoComplete="off"
            />
          </Field>

          <Field label="Phone" error={errors.supplier?.phone?.message}>
            <Input
              {...register("supplier.phone")}
              placeholder="+880 1XXX-XXXXXX"
              autoComplete="off"
            />
          </Field>

          <Field label="Email" error={errors.supplier?.email?.message}>
            <Input
              type="email"
              {...register("supplier.email")}
              placeholder="supplier@example.com"
              autoComplete="off"
            />
          </Field>

          <Field label="Address" error={errors.supplier?.address?.message}>
            <Input
              {...register("supplier.address")}
              placeholder="Kawran Bazar, Dhaka"
              autoComplete="off"
            />
          </Field>
        </div>
      </Section>

      {/* ------------------------------------------------------
       * Footer actions
       * ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={isPending}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={isPending || (isEdit && !isDirty)}
          className="min-w-35"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;

/* ============================================================
 * Section wrapper
 * ============================================================ */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-brand-border bg-brand-surface p-6">
      <header className="mb-5">
        <h2 className="font-heading text-base font-semibold text-brand-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

/* ============================================================
 * Field wrapper
 * ============================================================ */

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-brand-primary">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {children}

      {hint && !error && (
        <p className="text-xs text-brand-text-secondary">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ============================================================
 * Toggle row
 * ============================================================ */

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-brand-primary">{label}</p>
        {description && (
          <p className="text-xs text-brand-text-secondary">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
