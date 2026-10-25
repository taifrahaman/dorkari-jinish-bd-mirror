// src/app/[locale]/layout.tsx

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

import { routing, type Locale } from "@/i18n/routing";
import {
  getStorefrontCategoryTree,
  toCategoryNav,
} from "@/lib/storefront/category-nav";

import Navbar from "@/components/navigation/Navbar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { Footer } from "@/components/footer";
import AuthProvider from "@/components/providers/AuthProvider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const tree = await getStorefrontCategoryTree();
  const categories = toCategoryNav(tree, locale as Locale);

  return (
    <NextIntlClientProvider>
      <AuthProvider>
        <Navbar categories={categories} locale={locale as Locale} />
        {children}
        <MobileBottomNav />
        <Footer />
        <Toaster />
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
