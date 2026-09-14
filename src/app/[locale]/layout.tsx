// src/app/[locale]/layout.tsx

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

import MobileNavigation from "@/components/navigation/mobile/MobileNavigation";
import PageShell from "@/components/layout/PageShell";

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

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <NextIntlClientProvider>
      <div
        className="mobile-shell"
        style={{ ["--mobile-header-height" as string]: "64px" }}
      >
        <MobileNavigation />
        <PageShell>{children}</PageShell>
      </div>
    </NextIntlClientProvider>
  );
}
