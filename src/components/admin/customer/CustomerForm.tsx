// src/components/admin/customer/CustomerForm.tsx

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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "./TagInput";
import { AdminApiError } from "@/lib/admin/api";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/lib/validations/customer.schema";
import type { CustomerResponse } from "@/lib/validations/customer.schema";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

type FormInput = z.input<typeof createCustomerSchema>;
type FormOutput = z.output<typeof createCustomerSchema>;

export type CustomerFormProps = {
  customer?: CustomerResponse;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const CREATE_DEFAULTS: FormInput = {
  name: "",
  email: "",
  phone: "",
  address: "",
  source: "manual",
  role: "customer",
  tags: [],
  notes: "",
  status: "active",
};

function buildDefaults(customer?: CustomerResponse): FormInput {
  if (!customer) return CREATE_DEFAULTS;

  return {
    name: customer.name,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    source: customer.source,
    role: customer.role,
    tags: customer.tags ?? [],
    notes: customer.notes ?? "",
    status: customer.status,
  };
}

/* ============================================================
 * Options
 * ============================================================ */

const SOURCES = [
  { value: "online", label: "Online (storefront)" },
  { value: "google", label: "Google sign-in" },
  { value: "walk-in", label: "Walk-in" },
  { value: "phone", label: "Phone order" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Manual (admin-created)" },
  { value: "import", label: "Imported" },
] as const;

const ROLES = [{ value: "customer", label: "Customer" }] as const;

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const isEdit = Boolean(customer);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?._id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: buildDefaults(customer),
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
    if (customer) reset(buildDefaults(customer));
  }, [customer, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && customer) {
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
      }
      router.push("/admin/customers");
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
      {/* ------------------------------------------------------
       * Contact
       * ------------------------------------------------------ */}
      <Section title="Contact" description="Basic contact information.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="Rahim Uddin"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Phone"
            hint="Must be unique if provided."
            error={errors.phone?.message}
          >
            <Input
              {...register("phone")}
              placeholder="+880 1700-000000"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Email"
            hint="Optional — Facebook and WhatsApp customers often don't have one."
            error={errors.email?.message}
          >
            <Input
              type="email"
              {...register("email")}
              placeholder="optional@example.com"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label="Address" error={errors.address?.message}>
          <Textarea
            {...register("address")}
            rows={3}
            placeholder="Delivery address…"
          />
        </Field>
      </Section>

      {/* ------------------------------------------------------
       * Classification
       * ------------------------------------------------------ */}
      <Section
        title="Classification"
        description="Where this customer came from and how they should be treated."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Source" required error={errors.source?.message}>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v as CreateCustomerInput["source"])
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Role" required error={errors.role?.message}>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) =>
                    field.onChange(v as CreateCustomerInput["role"])
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-brand-primary">Active</p>
                <p className="text-xs text-brand-text-secondary">
                  Inactive customers can still be referenced by old orders.
                </p>
              </div>
              <Switch
                checked={field.value === "active"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "active" : "inactive")
                }
              />
            </div>
          )}
        />
      </Section>

      {/* ------------------------------------------------------
       * Tags
       * ------------------------------------------------------ */}
      <Section
        title="Tags"
        description="Free-form labels for filtering. e.g. vip, wholesale, repeat-buyer."
      >
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <TagInput
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder="Add a tag and press Enter…"
            />
          )}
        />
      </Section>

      {/* ------------------------------------------------------
       * Notes
       * ------------------------------------------------------ */}
      <Section
        title="Internal notes"
        description="Only visible to admins. Never shown to the customer."
      >
        <Field label="Notes" error={errors.notes?.message}>
          <Textarea
            {...register("notes")}
            rows={4}
            placeholder="Prefers bKash, delivers to office address after 5pm…"
          />
        </Field>
      </Section>

      {/* ------------------------------------------------------
       * Footer
       * ------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/customers")}
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
          {isEdit ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}

export default CustomerForm;

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
