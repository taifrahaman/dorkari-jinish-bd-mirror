// src/app/[locale]/checkout/success/page.tsx

import mongoose from "mongoose";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order.model";
import type { Locale } from "@/lib/shop/types";

// Never cache this page — the order status/amount could change
// if the admin cancels or refunds right after placement.
export const dynamic = "force-dynamic";

type OrderSummary = {
  orderNumber: string;
  totalAmount: number;
  itemCount: number;
  status: string;
  customerName?: string;
};

async function loadOrderSummary(orderId: string): Promise<OrderSummary | null> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return null;

  await connectToDatabase();

  const doc = await Order.findById(orderId)
    .select(
      "orderNumber totalAmount items status customerSnapshot.name guestName",
    )
    .lean<{
      orderNumber: string;
      totalAmount: number;
      items: Array<unknown>;
      status: string;
      customerSnapshot?: { name?: string };
      guestName?: string;
    } | null>();

  if (!doc) return null;

  return {
    orderNumber: doc.orderNumber,
    totalAmount: doc.totalAmount,
    itemCount: doc.items.length,
    status: doc.status,
    customerName: doc.customerSnapshot?.name ?? doc.guestName,
  };
}

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

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

  const order = orderId ? await loadOrderSummary(orderId) : null;

  /* ---------- Order not found ---------- */

  if (!order) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <XCircle className="h-12 w-12" />
        </div>

        <h1 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl">
          {locale === "bn"
            ? "অর্ডারটি খুঁজে পাওয়া যায়নি"
            : "We couldn't find that order"}
        </h1>

        <p className="mt-4 max-w-md text-brand-text-secondary">
          {locale === "bn"
            ? "অর্ডারটি হয়তো মুছে ফেলা হয়েছে অথবা লিংকটি সঠিক নয়। আপনার অর্ডার কনফার্মেশন ইমেইল দেখুন অথবা সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন।"
            : "The order may have been removed or the link is incorrect. Check your order confirmation email or contact us for help."}
        </p>

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

  /* ---------- Order found ---------- */

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

      <div className="mt-8 grid w-full max-w-md gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 text-left">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
            {locale === "bn" ? "অর্ডার নম্বর" : "Order number"}
          </span>
          <span className="font-mono text-sm font-semibold text-brand-text">
            {order.orderNumber}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-border pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
            {locale === "bn" ? "মোট" : "Total"}
          </span>
          <span className="font-heading text-base font-bold text-brand-text">
            {fmtPrice(order.totalAmount, locale)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-brand-border pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-text-secondary">
            {locale === "bn" ? "পণ্য সংখ্যা" : "Items"}
          </span>
          <span className="text-sm font-semibold text-brand-text">
            {order.itemCount}
          </span>
        </div>
      </div>

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
