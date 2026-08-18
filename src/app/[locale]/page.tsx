// src/app/[locale]/page.tsx

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-4xl md:text-6xl font-bold text-primary mb-4">
          {t("common.brandName")}
        </h1>

        <p className="font-body text-xl text-text-secondary mb-8">
          {t("home.heroSubtitle")}
        </p>

        <div className="flex gap-4 justify-center">
          <button className="bg-accent hover:bg-accent-hover text-primary font-semibold py-3 px-8 rounded-lg transition-colors">
            {t("home.shopNow")}
          </button>

          <button className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors">
            {t("home.sellNow")}
          </button>
        </div>
      </div>
    </main>
  );
}
