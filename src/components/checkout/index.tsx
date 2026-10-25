// src/components/checkout/index.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, ChevronLeft, Gift } from "lucide-react";
import { toast } from "sonner";

import type { Locale } from "@/lib/shop/types";
import type { DeliveryConfig } from "@/lib/product/types";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useHydration } from "@/lib/stores/useHydration";
import { parseCartKey } from "@/lib/cart/cart-key";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(11, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(10, "Full delivery address is required"),
  notes: z.string().optional(),
  // bKash/Nagad is not live yet — only cash on delivery is offered.
  paymentMethod: z.literal("cod"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

type CheckoutPageProps = {
  locale?: Locale;
  delivery: DeliveryConfig;
};

export default function CheckoutPage({
  locale = "en",
  delivery,
}: CheckoutPageProps) {
  const router = useRouter();
  const hydrated = useHydration();
  const items = useCartStore((s) => s.items);
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);

  const { user } = useAuthStore();
  const defaultAddress =
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || defaultAddress?.phone || "",
      email: user?.email || "",
      address: defaultAddress?.address || "",
      paymentMethod: "cod",
    },
  });

  useEffect(() => {
    if (user && !isForSomeoneElse) {
      if (!watch("name")) setValue("name", user.name);
      if (!watch("phone"))
        setValue("phone", user.phone || defaultAddress?.phone || "");
      if (!watch("email") && user.email) setValue("email", user.email);
      if (!watch("address") && defaultAddress)
        setValue("address", defaultAddress.address);
    }
  }, [user, defaultAddress, setValue, watch, isForSomeoneElse]);

  const handleToggleForSomeoneElse = (checked: boolean) => {
    setIsForSomeoneElse(checked);

    if (checked) {
      setValue("name", "");
      setValue("phone", "");
      setValue("address", "");
    } else {
      setValue("name", user?.name || "");
      setValue("phone", user?.phone || defaultAddress?.phone || "");
      setValue("address", defaultAddress?.address || "");
    }
  };

  if (!hydrated) return <div className="min-h-screen bg-brand-background" />;

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-4 text-2xl font-bold text-brand-text">
          {locale === "bn" ? "আপনার কার্ট খালি" : "Your cart is empty"}
        </h1>
        <Link
          href={`/${locale}/shop`}
          className="text-brand-primary hover:underline"
        >
          {locale === "bn" ? "শপে ফিরে যান" : "Return to shop"}
        </Link>
      </div>
    );
  }

  const freeShipping =
    delivery.freeShippingEnabled &&
    totalPrice >= delivery.freeShippingThreshold;
  const shippingFee = freeShipping ? 0 : delivery.fee;
  const finalTotal = totalPrice + shippingFee;

  const onSubmit = async (data: CheckoutForm) => {
    setIsSubmitting(true);
    try {
      const payloadItems = items.map((i) => ({
        productId: parseCartKey(i.productId).productId,
        quantity: i.quantity,
        colorHex: i.colorHex,
      }));

      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: data.name, phone: data.phone, email: data.email },
          shippingAddress: data.address,
          notes: data.notes,
          paymentMethod: data.paymentMethod,
          items: payloadItems,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Server error shape: { success: false, error: { message, code } }
        throw new Error(
          json?.error?.message || json?.message || "Failed to place order",
        );
      }

      clearCart();
      router.push(`/${locale}/checkout/success?orderId=${json.data._id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <Link
        href={`/${locale}/cart`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-text-secondary hover:text-brand-primary"
      >
        <ChevronLeft className="h-4 w-4" />{" "}
        {locale === "bn" ? "কার্টে ফিরে যান" : "Back to cart"}
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left: Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
            <h2 className="mb-4 font-heading text-lg font-bold text-brand-text">
              {locale === "bn" ? "ডেলিভারি তথ্য" : "Delivery Information"}
            </h2>

            {user && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-border bg-brand-navbar/50 p-4">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-white ring-1 ring-inset ring-brand-border">
                  <input
                    type="checkbox"
                    id="forSomeoneElse"
                    checked={isForSomeoneElse}
                    onChange={(e) =>
                      handleToggleForSomeoneElse(e.target.checked)
                    }
                    className="h-4 w-4 cursor-pointer accent-brand-primary"
                  />
                </div>
                <label
                  htmlFor="forSomeoneElse"
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-text"
                >
                  <Gift className="h-4 w-4 text-brand-primary" />
                  {locale === "bn"
                    ? "অন্য কারো জন্য অর্ডার করছেন?"
                    : "Ordering for someone else?"}
                </label>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-brand-text">
                  Full Name
                </label>
                <input
                  {...register("name")}
                  className="w-full rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-brand-text">
                  Phone Number
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
                  Email (Optional)
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

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-brand-text">
                  Full Address
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
                  placeholder="House 12, Road 5, Dhanmondi, Dhaka"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6">
            <h2 className="mb-4 font-heading text-lg font-bold text-brand-text">
              {locale === "bn" ? "পেমেন্ট মেথড" : "Payment Method"}
            </h2>

            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-border p-4 has-[:checked]:border-brand-primary has-[:checked]:bg-brand-primary/5">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="cod"
                    {...register("paymentMethod")}
                    className="h-4 w-4 accent-brand-primary"
                  />
                  <span className="text-sm font-semibold text-brand-text">
                    Cash on Delivery
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-brand-text">
                Order Notes (Optional)
              </label>
              <textarea
                {...register("notes")}
                rows={2}
                className="w-full resize-none rounded-xl border border-brand-border bg-transparent px-4 py-3 text-sm outline-none focus:border-brand-primary"
                placeholder="Any special instructions for delivery..."
              />
            </div>
          </div>
        </form>

        {/* Right: Order Summary */}
        <div className="sticky top-[calc(var(--shop-nav)+1rem)] flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface p-6">
          <h2 className="font-heading text-lg font-bold text-brand-text">
            Order Summary
          </h2>

          <div className="flex max-h-[300px] flex-col gap-4 overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="h-14 w-14 flex-none overflow-hidden rounded-lg bg-brand-navbar">
                  {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="line-clamp-1 text-sm font-medium">
                    {item.name}
                  </span>
                  <span className="text-xs text-brand-text-secondary">
                    Qty: {item.quantity}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {fmtPrice(item.price * item.quantity, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-2 border-t border-brand-border" />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-brand-text-secondary">
              <span>Subtotal</span>
              <span className="text-brand-text">
                {fmtPrice(totalPrice, locale)}
              </span>
            </div>
            <div className="flex justify-between text-brand-text-secondary">
              <span>Shipping</span>
              <span className="text-brand-text">
                {freeShipping ? "Free" : fmtPrice(shippingFee, locale)}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-xl bg-brand-navbar p-4">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-heading text-xl font-bold">
              {fmtPrice(finalTotal, locale)}
            </span>
          </div>

          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-primary text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Place Order"
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-brand-text-secondary">
            <ShieldCheck className="h-4 w-4" /> Secure checkout
          </p>
        </div>
      </div>
    </div>
  );
}
