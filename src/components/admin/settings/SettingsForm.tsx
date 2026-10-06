// src/components/admin/settings/SettingsForm.tsx

"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminApiError } from "@/lib/admin/api";
import { updateSettingsSchema } from "@/lib/validations/setting.schema";
import { useSettings, useUpdateSettings } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof updateSettingsSchema>;
type FormOutput = z.output<typeof updateSettingsSchema>;

/* ============================================================
 * Defaults
 * ============================================================ */

const DEFAULTS: FormInput = {
  store: {
    name: "",
    phone: "",
    email: "",
    address: "",
    website: "",
  },
  vat: {
    enabled: false,
    defaultRate: 15,
    inclusive: true,
  },
  lowStockThreshold: 5,
};

/* ============================================================
 * Component
 * ============================================================ */

export function SettingsForm() {
  const query = useSettings();
  const mutation = useUpdateSettings();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(updateSettingsSchema),
    defaultValues: DEFAULTS,
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    setError,
    watch,
  } = form;

  /* Hydrate when settings arrive */
  useEffect(() => {
    if (!query.data) return;
    reset({
      store: {
        name: query.data.store.name,
        phone: query.data.store.phone ?? "",
        email: query.data.store.email ?? "",
        address: query.data.store.address ?? "",
        website: query.data.store.website ?? "",
      },
      vat: {
        enabled: query.data.vat.enabled,
        defaultRate: query.data.vat.defaultRate,
        inclusive: query.data.vat.inclusive,
      },
      lowStockThreshold: query.data.lowStockThreshold,
    });
  }, [query.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      // Reset the "dirty" flag so Save disables again
      reset(values);
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

  const vatEnabled = watch("vat.enabled");

  /* ----------------------------------------------------------
   * Loading
   * ---------------------------------------------------------- */

  if (query.isLoading && !query.data) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
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

  if (query.isError || !query.data) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {query.error instanceof Error
          ? query.error.message
          : "Failed to load settings."}
      </div>
    );
  }

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Store info */}
      <Section
        title="Store information"
        description="Displayed on invoices, receipts, and email notifications."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Store name"
            required
            error={errors.store?.name?.message}
          >
            <Input
              {...register("store.name")}
              placeholder="Dorkari Jinish BD"
              autoComplete="off"
            />
          </Field>

          <Field label="Phone" error={errors.store?.phone?.message}>
            <Input
              {...register("store.phone")}
              placeholder="+880 1XXX-XXXXXX"
              autoComplete="off"
            />
          </Field>

          <Field label="Email" error={errors.store?.email?.message}>
            <Input
              type="email"
              {...register("store.email")}
              placeholder="hello@dorkari.com"
              autoComplete="off"
            />
          </Field>

          <Field label="Website" error={errors.store?.website?.message}>
            <Input
              {...register("store.website")}
              placeholder="https://dorkari.com"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label="Address" error={errors.store?.address?.message}>
          <Textarea
            {...register("store.address")}
            rows={3}
            placeholder="Shop address…"
          />
        </Field>
      </Section>

      {/* VAT */}
      <Section
        title="VAT"
        description="Configure tax collection on orders. Leave disabled if you don't charge VAT."
      >
        <Controller
          control={control}
          name="vat.enabled"
          render={({ field }) => (
            <ToggleRow
              label="Enable VAT"
              description="When enabled, VAT is calculated on new orders using each product's tax rate."
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )}
        />

        {vatEnabled && (
          <div className="grid gap-5 border-t border-brand-border pt-5 md:grid-cols-2">
            <Field
              label="Default rate (%)"
              hint="Used when a product doesn't specify its own rate."
              error={errors.vat?.defaultRate?.message}
            >
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register("vat.defaultRate", { valueAsNumber: true })}
                placeholder="15"
              />
            </Field>

            <Controller
              control={control}
              name="vat.inclusive"
              render={({ field }) => (
                <ToggleRow
                  label="Prices include VAT"
                  description="When on, VAT is back-computed from the total. When off, VAT is added on top of prices."
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        )}
      </Section>

      {/* Inventory */}
      <Section
        title="Inventory"
        description="Global default for low-stock alerts. Individual products can override this."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Low stock threshold"
            hint="Products with stock at or below this value show a warning."
            error={errors.lowStockThreshold?.message}
          >
            <Input
              type="number"
              min="0"
              {...register("lowStockThreshold", { valueAsNumber: true })}
              placeholder="5"
            />
          </Field>
        </div>
      </Section>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="submit"
          disabled={mutation.isPending || !isDirty}
          className="min-w-35"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default SettingsForm;

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
