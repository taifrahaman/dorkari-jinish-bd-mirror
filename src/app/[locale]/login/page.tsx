// src/app/[locale]/login/page.tsx

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

const schema = z.object({
  identifier: z.string().min(1, "Phone or Email is required"),
  password: z.string().min(6, "Password is required"),
});

export default function LoginPage({
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Login failed");

      setUser(json.user);
      toast.success(
        locale === "bn" ? "সফলভাবে লগইন হয়েছে" : "Logged in successfully",
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
            {locale === "bn" ? "লগইন করুন" : "Welcome Back"}
          </h1>
          <p className="mt-2 text-sm text-brand-text-secondary">
            {locale === "bn"
              ? "আপনার অ্যাকাউন্টে প্রবেশ করুন"
              : "Enter your details to access your account"}
          </p>
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
              {locale === "bn"
                ? "মোবাইল নম্বর বা ইমেইল"
                : "Phone Number or Email"}
            </label>
            <input
              {...register("identifier")}
              type="text"
              className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
              placeholder="017XXXXXXXX or john@email.com"
            />
            {errors.identifier && (
              <p className="mt-1 text-xs text-red-500">
                {errors.identifier.message}
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

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : locale === "bn" ? (
              "লগইন"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-text-secondary">
          {locale === "bn" ? "অ্যাকাউন্ট নেই?" : "Don't have an account?"}{" "}
          <Link
            href={`/${locale}/register`}
            className="font-semibold text-brand-primary hover:underline"
          >
            {locale === "bn" ? "রেজিস্টার করুন" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}
