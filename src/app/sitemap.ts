// src/app/sitemap.ts

import type { MetadataRoute } from "next";

import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product.model";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dorkarijinish.bd"
).replace(/\/$/, "");

const LOCALES = ["en", "bn"] as const;

/** Rebuild at most once an hour, so new products show up without a deploy. */
export const revalidate = 3600;

const urlFor = (locale: string, path: string) => `${BASE_URL}/${locale}${path}`;

/** One entry per locale, each pointing at all its translations. */
function localized(path: string, lastModified?: Date): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {
    ...Object.fromEntries(LOCALES.map((l) => [l, urlFor(l, path)])),
    "x-default": urlFor("en", path),
  };

  return LOCALES.map((locale) => ({
    url: urlFor(locale, path),
    lastModified,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDatabase();

  const products = await Product.find({ isActive: true, deletedAt: null })
    .select("slug updatedAt")
    .lean();

  // The listing pages change whenever any product does.
  const latest = products.reduce<Date | undefined>((max, p) => {
    const d = p.updatedAt ? new Date(p.updatedAt) : undefined;
    return d && (!max || d > max) ? d : max;
  }, undefined);

  const staticPages: MetadataRoute.Sitemap = [
    ...localized("", latest),
    ...localized("/shop", latest),
    ...localized("/deals", latest),
  ];

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => Boolean(p.slug))
    .flatMap((p) =>
      localized(
        `/product/${encodeURIComponent(p.slug)}`,
        p.updatedAt ? new Date(p.updatedAt) : undefined,
      ),
    );

  return [...staticPages, ...productPages];
}
