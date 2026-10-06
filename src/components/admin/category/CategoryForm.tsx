// src/components/admin/category/CategoryForm.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CategoryCombobox } from "@/components/admin/category-combobox";
import type { CategoryOption } from "@/components/admin/category-combobox";
import { ImageUploader } from "@/components/admin/image-uploader";
import { SpecTemplateEditor } from "./SpecTemplateEditor";
import { AdminApiError } from "@/lib/admin/api";
import { createCategorySchema } from "@/lib/validations/category.schema";
import type {
  CategoryResponse,
  CategoryTreeNode,
} from "@/lib/validations/category.schema";
import type { ImageRef } from "@/services/cloudinary.service";
import { useCreateCategory, useUpdateCategory } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof createCategorySchema>;
type FormOutput = z.output<typeof createCategorySchema>;

export type CategoryFormProps = {
  category?: CategoryResponse;
  tree: CategoryTreeNode[];
};

/* ============================================================
 * Helpers
 * ============================================================ */

function flattenTree(nodes: CategoryTreeNode[]): CategoryOption[] {
  const out: CategoryOption[] = [];

  function walk(list: CategoryTreeNode[]) {
    for (const node of list) {
      out.push({
        _id: node._id,
        name: node.name.en,
        path: node.path,
        specTemplate: node.specTemplate,
      });
      if (node.children?.length) walk(node.children);
    }
  }

  walk(nodes);
  return out;
}

function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>();
  function walk(n: CategoryTreeNode) {
    ids.add(n._id);
    for (const child of n.children ?? []) walk(child);
  }
  walk(node);
  return ids;
}

function findNode(
  nodes: CategoryTreeNode[],
  id: string,
): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

/* ============================================================
 * Defaults
 * ============================================================ */

const CREATE_DEFAULTS: FormInput = {
  name: { en: "", bn: "" },
  slug: undefined,
  description: "",
  parent: null,
  image: undefined,
  specTemplate: [],
  order: 0,
  isActive: true,
};

function buildDefaults(category?: CategoryResponse): FormInput {
  if (!category) return CREATE_DEFAULTS;

  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    parent: category.parent ?? null,
    image: category.image,
    specTemplate: category.specTemplate ?? [],
    order: category.order,
    isActive: category.isActive,
  };
}

/* ============================================================
 * Component
 * ============================================================ */

export function CategoryForm({ category, tree }: CategoryFormProps) {
  const router = useRouter();
  const isEdit = Boolean(category);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(category?._id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [draftId] = useState(
    () => `draft-${Math.random().toString(36).slice(2, 10)}`,
  );
  const draftOwner = category?.slug ?? draftId;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: buildDefaults(category),
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
    if (category) reset(buildDefaults(category));
  }, [category, reset]);

  const parentOptions = useMemo<CategoryOption[]>(() => {
    const all = flattenTree(tree);
    if (!isEdit || !category) return all;

    const selfNode = findNode(tree, category._id);
    if (!selfNode) return all;

    const forbidden = collectDescendantIds(selfNode);
    return all.filter((c) => !forbidden.has(c._id));
  }, [tree, isEdit, category]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.push("/admin/categories");
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
      <Section title="Basics" description="Name, slug, and description.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Name (English)"
            required
            error={errors.name?.en?.message}
          >
            <Input
              {...register("name.en")}
              placeholder="Air Conditioners"
              autoComplete="off"
            />
          </Field>

          <Field label="Name (বাংলা)" required error={errors.name?.bn?.message}>
            <Input
              {...register("name.bn")}
              placeholder="এয়ার কন্ডিশনার"
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
              placeholder="air-conditioners"
              autoComplete="off"
            />
          </Field>

          <Field label="Order" error={errors.order?.message}>
            <Input
              type="number"
              min="0"
              {...register("order", { valueAsNumber: true })}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message}>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder="Short description of this category…"
          />
        </Field>
      </Section>

      <Section
        title="Hierarchy"
        description="Nest this category under a parent, or leave it at the top level."
      >
        <Field label="Parent category" error={errors.parent?.message}>
          <Controller
            control={control}
            name="parent"
            render={({ field }) => (
              <CategoryCombobox
                value={field.value ?? undefined}
                onChange={(id) => field.onChange(id ?? null)}
                initialCategories={parentOptions}
                allowCreate={false}
                placeholder="Top level (no parent)"
              />
            )}
          />
        </Field>

        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-brand-primary">Active</p>
                <p className="text-xs text-brand-text-secondary">
                  Visible on the storefront.
                </p>
              </div>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </div>
          )}
        />
      </Section>

      <Section
        title="Specification template"
        description="When a new product is assigned to this category, these keys will be pre-filled as empty rows."
      >
        <Controller
          control={control}
          name="specTemplate"
          render={({ field }) => (
            <SpecTemplateEditor
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </Section>

      <Section
        title="Cover image"
        description="Optional. Shown on category landing pages."
      >
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <ImageUploader
              entity="categories"
              owner={draftOwner}
              value={
                field.value
                  ? [
                      {
                        url: field.value.url,
                        publicId: field.value.publicId,
                        alt: field.value.alt ?? "",
                      },
                    ]
                  : []
              }
              onChange={(images: ImageRef[]) =>
                field.onChange(
                  images[0]
                    ? {
                        url: images[0].url,
                        publicId: images[0].publicId,
                        alt: images[0].alt ?? "",
                      }
                    : undefined,
                )
              }
              maxImages={1}
              getPublicId={() => "cover"}
            />
          )}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/categories")}
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
          {isEdit ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}

export default CategoryForm;

/* ============================================================
 * Section
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
    <section className="space-y-5 rounded-lg border border-brand-border bg-brand-surface p-6">
      <header>
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
 * Field
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
