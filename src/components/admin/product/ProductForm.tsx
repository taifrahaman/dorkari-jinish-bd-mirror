// src/components/admin/product/ProductForm.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  CategoryCombobox,
  type CategoryOption,
} from "@/components/admin/category-combobox/CategoryCombobox";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ColorMultiSelect } from "@/components/admin/color";
import { SpecificationEditor } from "./SpecificationEditor";
import { AdminApiError } from "@/lib/admin/api";
import { createProductSchema } from "@/lib/validations/product.schema";
import type { ProductResponse } from "@/lib/validations/product.schema";
import type { ImageRef } from "@/services/cloudinary.service";
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
  category: "",
  brand: undefined,
  stock: 0,
  images: [],
  colors: [],
  sku: undefined,
  weight: undefined,
  dimensions: undefined,
  specifications: {},
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
    category: categoryId,
    brand: brandId,
    stock: product.stock,
    images: product.images,
    colors: product.colors ?? [],
    sku: product.sku,
    weight: product.weight,
    dimensions: product.dimensions,
    specifications: (product.specifications as Record<string, string>) ?? {},
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  };
}

/* ============================================================
 * Component
 * ============================================================ */

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct(product?._id ?? "");

  const isPending = createMutation.isPending || updateMutation.isPending;

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
   * Auto-populate spec template on category change
   *
   * Only applies in create mode. Tracks which templates have
   * already been applied (by category id) so re-selecting the
   * same category doesn't re-add deleted keys.
   * ---------------------------------------------------------- */

  const currentCategoryId = watch("category");
  const currentSpecs = watch("specifications");

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === currentCategoryId),
    [categories, currentCategoryId],
  );

  const appliedTemplatesRef = useRef<Set<string>>(new Set());

  /* Track which keys were added by the template so we can show
   * a hint and let the user dismiss them. */
  const [templateApplied, setTemplateApplied] = useState<{
    categoryId: string;
    added: number;
  } | null>(null);

  useEffect(() => {
    if (isEdit) return;
    if (!selectedCategory?.specTemplate?.length) return;
    if (appliedTemplatesRef.current.has(selectedCategory._id)) return;

    const current = currentSpecs ?? {};
    const next: Record<string, string> = { ...current };
    let added = 0;

    for (const key of selectedCategory.specTemplate) {
      if (!(key in next)) {
        next[key] = "";
        added += 1;
      }
    }

    if (added > 0) {
      setValue("specifications", next, { shouldDirty: true });
      setTemplateApplied({
        categoryId: selectedCategory._id,
        added,
      });
    }

    appliedTemplatesRef.current.add(selectedCategory._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory?._id, isEdit, setValue]);

  /* Remove all empty template keys when dismissed */
  const dismissTemplateHint = () => {
    setTemplateApplied(null);
  };

  /* ----------------------------------------------------------
   * Submit
   * ---------------------------------------------------------- */

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.push("/admin/products");
      router.refresh();
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

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Basic info */}
      <Section
        title="Basic information"
        description="Product name, slug, and SKU."
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
        </div>
      </Section>

      {/* Pricing */}
      <Section
        title="Pricing & stock"
        description="Set the selling price and inventory level."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Price (BDT)" required error={errors.price?.message}>
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
              {...register("compareAtPrice", { valueAsNumber: true })}
              placeholder="72000"
            />
          </Field>

          <Field label="Stock" required error={errors.stock?.message}>
            <Input
              type="number"
              min="0"
              {...register("stock", { valueAsNumber: true })}
              placeholder="8"
            />
          </Field>
        </div>
      </Section>

      {/* Organization */}
      <Section
        title="Organization"
        description="Category and visibility settings."
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

          <div className="space-y-3">
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
        </div>
      </Section>

      {/* Descriptions */}
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

      {/* Shipping */}
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

      {/* Images */}
      <Section
        title="Images"
        description="Drag to reorder is not yet supported. First image is primary."
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

      {/* Colors */}
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

      {/* Specifications */}
      <Section
        title="Specifications"
        description="Type a key to see suggestions from existing products."
      >
        {templateApplied && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-brand-accent/30 bg-brand-accent-light px-3 py-2 text-xs text-brand-primary">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Added {templateApplied.added} template key
                {templateApplied.added === 1 ? "" : "s"} from this category.
              </span>
            </div>
            <button
              type="button"
              onClick={dismissTemplateHint}
              className="grid h-5 w-5 place-items-center rounded-full text-brand-primary/60 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        )}

        <SpecificationEditor
          value={watch("specifications") ?? {}}
          onChange={(next) =>
            setValue("specifications", next, { shouldDirty: true })
          }
          categoryId={currentCategoryId || undefined}
        />
      </Section>

      {/* Footer */}
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
