// src/components/admin/color/ColorForm.tsx

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminApiError } from "@/lib/admin/api";
import { createColorSchema } from "@/lib/validations/color.schema";
import type { ColorResponse } from "@/lib/validations/color.schema";
import { useCreateColor, useUpdateColor } from "@/hooks/admin";
import { ColorEyedropperButton } from "./ColorEyedropperButton";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof createColorSchema>;
type FormOutput = z.output<typeof createColorSchema>;

export type ColorFormProps = {
  color?: ColorResponse;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const CREATE_DEFAULTS: FormInput = {
  name: { en: "", bn: "" },
  hex: "#ffffff",
  slug: undefined,
  order: 0,
  isActive: true,
};

function buildDefaults(color?: ColorResponse): FormInput {
  if (!color) return CREATE_DEFAULTS;

  return {
    name: color.name,
    hex: color.hex,
    slug: color.slug,
    order: color.order,
    isActive: color.isActive,
  };
}

/* ============================================================
 * Component
 * ============================================================ */

export function ColorForm({ color }: ColorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(color);

  const createMutation = useCreateColor();
  const updateMutation = useUpdateColor(color?._id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createColorSchema),
    defaultValues: buildDefaults(color),
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
    if (color) reset(buildDefaults(color));
  }, [color, reset]);

  const currentHex = watch("hex");
  const hexValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(currentHex);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && color) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.push("/admin/colors");
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
      <Section title="Details" description="Color name and hex value.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Name (English)"
            required
            error={errors.name?.en?.message}
          >
            <Input
              {...register("name.en")}
              placeholder="Silver"
              autoComplete="off"
            />
          </Field>

          <Field label="Name (বাংলা)" required error={errors.name?.bn?.message}>
            <Input
              {...register("name.bn")}
              placeholder="সিলভার"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field
          label="Hex color"
          required
          hint="Used to render swatches across the admin and storefront."
          error={errors.hex?.message}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-10 w-10 shrink-0 rounded-md border border-brand-border",
                !hexValid && "border-destructive",
              )}
              style={{
                backgroundColor: hexValid ? currentHex : "transparent",
              }}
              aria-hidden="true"
            />

            <Input
              {...register("hex")}
              placeholder="#c0c0c0"
              className={cn(
                "h-10 flex-1 font-mono text-sm",
                !hexValid && "border-destructive",
              )}
              autoComplete="off"
            />

            <Controller
              control={control}
              name="hex"
              render={({ field }) => (
                <ColorEyedropperButton
                  compact
                  onPick={(hex) => setValue("hex", hex, { shouldDirty: true })}
                  imageUrls={[]}
                  disabled={field.disabled}
                />
              )}
            />
          </div>
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Slug"
            hint="Leave blank to auto-generate from the English name."
            error={errors.slug?.message}
          >
            <Input
              {...register("slug")}
              placeholder="silver"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Order"
            hint="Lower numbers appear first in pickers."
            error={errors.order?.message}
          >
            <Input
              type="number"
              min="0"
              {...register("order", { valueAsNumber: true })}
              placeholder="0"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Visibility"
        description="Inactive colors are hidden from product forms."
      >
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-brand-primary">Active</p>
                <p className="text-xs text-brand-text-secondary">
                  Selectable from the product color picker.
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

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/colors")}
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
          {isEdit ? "Save changes" : "Create color"}
        </Button>
      </div>
    </form>
  );
}

export default ColorForm;

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
