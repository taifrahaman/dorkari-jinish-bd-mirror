// src/app/[locale]/checkout/success/page.tsx

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Locale } from "@/lib/shop/types";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { locale: raw } = await params;
  const { orderId } = await searchParams;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <h1 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl">
        {locale === "bn" ? "অর্ডার সফল হয়েছে!" : "Order Confirmed!"}
      </h1>

      <p className="mt-4 max-w-md text-brand-text-secondary">
        {locale === "bn"
          ? "আপনার অর্ডারের জন্য ধন্যবাদ। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।"
          : "Thank you for your purchase. We will contact you shortly to confirm delivery details."}
      </p>

      {orderId && (
        <div className="mt-6 rounded-xl border border-brand-border bg-brand-surface px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
            Order ID
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-brand-text">
            {orderId}
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href={`/${locale}/shop`}
          className="rounded-full bg-brand-primary px-8 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          {locale === "bn" ? "শপিং চালিয়ে যান" : "Continue Shopping"}
        </Link>
        <Link
          href={`/${locale}`}
          className="rounded-full border border-brand-border px-8 py-3 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-navbar"
        >
          {locale === "bn" ? "হোমে ফিরে যান" : "Back to Home"}
        </Link>
      </div>
    </div>
  );
}
