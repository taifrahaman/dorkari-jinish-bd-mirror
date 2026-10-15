// src/components/admin/brand/BrandForm.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUploader } from "@/components/admin/image-uploader";
import { AdminApiError } from "@/lib/admin/api";
import { createBrandSchema } from "@/lib/validations/brand.schema";
import type { BrandResponse } from "@/lib/validations/brand.schema";
import type { ImageRef } from "@/services/cloudinary.service";
import { useCreateBrand, useUpdateBrand } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof createBrandSchema>;
type FormOutput = z.output<typeof createBrandSchema>;

export type BrandFormProps = {
  brand?: BrandResponse;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const CREATE_DEFAULTS: FormInput = {
  name: { en: "", bn: "" },
  slug: undefined,
  logo: undefined,
  isActive: true,
};

function buildDefaults(brand?: BrandResponse): FormInput {
  if (!brand) return CREATE_DEFAULTS;
  return {
    name: brand.name,
    slug: brand.slug,
    logo: brand.logo,
    isActive: brand.isActive,
  };
}

/* ============================================================
 * Component
 * ============================================================ */

export function BrandForm({ brand }: BrandFormProps) {
  const router = useRouter();
  const isEdit = Boolean(brand);

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand(brand?._id ?? "");

  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: buildDefaults(brand),
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = form;

  useEffect(() => {
    if (brand) reset(buildDefaults(brand));
  }, [brand, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && brand) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.push("/admin/brands");
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

  const logoOwner = brand?.slug ?? "new-brand";

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section title="Brand information">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Name (English)"
            required
            error={errors.name?.en?.message}
          >
            <Input
              {...register("name.en")}
              placeholder="Walton"
              autoComplete="off"
            />
          </Field>

          <Field label="Name (বাংলা)" required error={errors.name?.bn?.message}>
            <Input
              {...register("name.bn")}
              placeholder="ওয়ালটন"
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
              placeholder="walton"
              autoComplete="off"
            />
          </Field>

          <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-brand-primary">Active</p>
              <p className="text-xs text-brand-text-secondary">
                Selectable on products.
              </p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Logo"
        description="Optional. Square PNG or SVG works best."
      >
        <Controller
          control={control}
          name="logo"
          render={({ field }) => (
            <ImageUploader
              entity="brands"
              owner={logoOwner}
              value={
                field.value ? ([field.value] as ImageRef[]) : ([] as ImageRef[])
              }
              onChange={(imgs) => field.onChange(imgs[0] ?? null)}
              maxImages={1}
            />
          )}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/brands")}
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
          {isEdit ? "Save changes" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}

export default BrandForm;

/* ============================================================
 * Section / Field wrappers
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
