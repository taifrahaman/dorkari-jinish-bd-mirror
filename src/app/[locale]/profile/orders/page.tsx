// src/app/[locale]/profile/orders/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { Loader2, PackageSearch } from "lucide-react";
import type { Locale } from "@/lib/shop/types";
import type { OrderResponse } from "@/lib/validations/order.schema";

export default function OrderTrackerPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  params.then((p) => setLocale(p.locale as Locale));

  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
      return;
    }

    if (user) {
      fetch("/api/storefront/orders/my-orders")
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setOrders(json.data.items);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, authLoading, router, locale]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-700";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <Link
        href={`/${locale}/profile`}
        className="mb-6 inline-block text-sm font-medium text-brand-text-secondary hover:text-brand-primary"
      >
        ← {locale === "bn" ? "প্রোফাইলে ফিরে যান" : "Back to profile"}
      </Link>

      <h1 className="mb-8 font-heading text-3xl font-bold text-brand-text">
        {locale === "bn" ? "আমার অর্ডারসমূহ" : "My Orders"}
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border bg-brand-surface py-20 text-center">
          <PackageSearch className="mb-4 h-12 w-12 text-brand-text-secondary/50" />
          <p className="text-lg font-semibold text-brand-text">
            {locale === "bn" ? "কোনো অর্ডার পাওয়া যায়নি" : "No orders found"}
          </p>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {locale === "bn"
              ? "আপনি এখনো কোনো অর্ডার করেননি।"
              : "You haven't placed any orders yet."}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="mt-6 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            {locale === "bn" ? "কেনাকাটা শুরু করুন" : "Start Shopping"}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-brand-text-secondary uppercase">
                  Order #{order.orderNumber}
                </p>
                <p className="mt-1 text-sm text-brand-text-secondary">
                  {new Date(order.orderDate).toLocaleDateString(
                    locale === "bn" ? "bn-BD" : "en-US",
                    { dateStyle: "medium" },
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                  <span className="rounded-full bg-brand-navbar px-2.5 py-1 text-[11px] font-bold uppercase text-brand-text-secondary">
                    {order.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-brand-border pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                <p className="font-heading text-lg font-bold text-brand-text">
                  ৳{order.totalAmount}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {order.items.length} items
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
