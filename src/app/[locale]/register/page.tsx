// src/app/[locale]/register/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import type { Locale } from "@/lib/shop/types";

// Schema with Confirm Password validation
const schema = z
  .object({
    name: z.string().min(2, "Name is required"),
    phone: z
      .string()
      .regex(/^01[3-9]\d{8}$/, "Must be a valid BD number (e.g., 01712345678)"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  params.then((p) => setLocale(p.locale as Locale));

  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");

      setUser(json.user);
      toast.success(
        locale === "bn"
          ? "অ্যাকাউন্ট তৈরি হয়েছে"
          : "Account created successfully",
      );
      router.push(`/${locale}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-brand-border bg-brand-surface p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-text">
            {locale === "bn" ? "অ্যাকাউন্ট তৈরি করুন" : "Create an Account"}
          </h1>
        </div>

        <GoogleAuthButton />

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-brand-border" />
          <span className="text-xs font-medium uppercase text-brand-text-secondary">
            or
          </span>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">
              Full Name
            </label>
            <input
              {...register("name")}
              className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">
              {locale === "bn" ? "মোবাইল নম্বর" : "Phone Number"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
              placeholder="017XXXXXXXX"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">
              {locale === "bn" ? "ইমেইল (ঐচ্ছিক)" : "Email (Optional)"}
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 pr-12 text-sm outline-none focus:border-brand-primary"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-text-secondary hover:text-brand-text"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-text">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 pr-12 text-sm outline-none focus:border-brand-primary"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : locale === "bn" ? (
              "রেজিস্টার"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-text-secondary">
          {locale === "bn"
            ? "ইতিমধ্যে অ্যাকাউন্ট আছে?"
            : "Already have an account?"}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-brand-primary hover:underline"
          >
            {locale === "bn" ? "লগইন করুন" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
