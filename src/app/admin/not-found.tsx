// src/app/admin/not-found.tsx

import type { Metadata } from "next";
import Link from "next/link";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  SearchX,
  ShoppingCart,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Not found | Admin",
};

const QUICK_LINKS = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
];

export default function AdminNotFound() {
  return (
    <main className="flex min-h-[70dvh] items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-3xl border border-brand-border bg-brand-surface p-6 text-center shadow-[0_1px_2px_rgba(23,38,66,0.05),0_20px_40px_-20px_rgba(23,38,66,0.2)] sm:p-9">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand-navbar text-brand-primary">
          <SearchX className="h-7 w-7" strokeWidth={1.8} />
        </div>

        <p className="font-heading text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-teal">
          Error 404
        </p>

        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.02em] text-brand-primary sm:text-[1.75rem]">
          Page not found
        </h1>

        <p className="mx-auto mt-2.5 max-w-sm text-[15px] leading-relaxed text-brand-text-secondary">
          This page or record doesn&apos;t exist. It may have been deleted, or
          the link may be wrong.
        </p>

        <div className="mt-7 flex justify-center">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition duration-200 hover:bg-brand-primary-dark active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="mt-7 border-t border-brand-border pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-text-secondary">
            Or jump to
          </p>

          <ul className="flex flex-wrap justify-center gap-2">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 text-sm font-medium text-brand-text transition duration-200 hover:border-brand-accent hover:bg-brand-accent/15 active:scale-95"
                >
                  <Icon className="h-4 w-4 text-brand-text-secondary" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
