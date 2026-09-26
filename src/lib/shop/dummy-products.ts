// src/lib/shop/dummy-products.ts
//
// Placeholder catalog until the backend exists. Everything here is generated
// with a seeded pseudo-random function instead of Math.random()/Date.now(),
// so the server-rendered and client-rendered output always match — the same
// class of bug that showed up in CountdownBanner's CLOCK_TICKS.

import type { ProductColor, ShopProduct } from "./types";

/* ------------------------------------------------------------------ */
/* Seeded RNG — deterministic across server + client renders           */
/* ------------------------------------------------------------------ */

function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Taxonomy                                                             */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  {
    slug: "refrigerator",
    en: "Refrigerators",
    bn: "রেফ্রিজারেটর",
    priceMin: 28000,
    priceMax: 95000,
  },
  {
    slug: "air-conditioner",
    en: "Air Conditioners",
    bn: "এয়ার কন্ডিশনার",
    priceMin: 38000,
    priceMax: 125000,
  },
  {
    slug: "washing-machine",
    en: "Washing Machines",
    bn: "ওয়াশিং মেশিন",
    priceMin: 19000,
    priceMax: 62000,
  },
  {
    slug: "microwave",
    en: "Microwave Ovens",
    bn: "মাইক্রোওয়েভ ওভেন",
    priceMin: 7000,
    priceMax: 26000,
  },
  {
    slug: "blender",
    en: "Blenders & Mixers",
    bn: "ব্লেন্ডার ও মিক্সার",
    priceMin: 1600,
    priceMax: 8500,
  },
  {
    slug: "rice-cooker",
    en: "Rice Cookers",
    bn: "রাইস কুকার",
    priceMin: 1900,
    priceMax: 6800,
  },
] as const;

const BRANDS = [
  { slug: "walton", en: "Walton", bn: "ওয়ালটন" },
  { slug: "vision", en: "Vision", bn: "ভিশন" },
  { slug: "jamuna", en: "Jamuna", bn: "যমুনা" },
  { slug: "marcel", en: "Marcel", bn: "মার্সেল" },
  { slug: "singer", en: "Singer", bn: "সিঙ্গার" },
  { slug: "miyako", en: "Miyako", bn: "মিয়াকো" },
  { slug: "lg", en: "LG", bn: "এলজি" },
  { slug: "samsung", en: "Samsung", bn: "স্যামসাং" },
  { slug: "panasonic", en: "Panasonic", bn: "প্যানাসনিক" },
  { slug: "whirlpool", en: "Whirlpool", bn: "হুইরলপুল" },
] as const;

const COLOR_PALETTE: ProductColor[] = [
  { hex: "#f5f5f4", name: { en: "White", bn: "সাদা" } },
  { hex: "#1f2937", name: { en: "Black", bn: "কালো" } },
  { hex: "#9ca3af", name: { en: "Silver", bn: "সিলভার" } },
  { hex: "#7f1d1d", name: { en: "Maroon", bn: "মেরুন" } },
  { hex: "#1e3a5f", name: { en: "Navy", bn: "নেভি" } },
  { hex: "#556b2f", name: { en: "Olive", bn: "জলপাই" } },
];

const NAME_PARTS: Record<
  (typeof CATEGORIES)[number]["slug"],
  { en: string[]; bn: string[] }
> = {
  refrigerator: {
    en: ["Direct Cool", "Frost Free", "Inverter Duo", "Side-by-Side"],
    bn: ["ডাইরেক্ট কুল", "ফ্রস্ট ফ্রি", "ইনভার্টার ডুয়ো", "সাইড-বাই-সাইড"],
  },
  "air-conditioner": {
    en: ["Inverter Split", "Non-Inverter Split", "Cassette", "Smart Split"],
    bn: [
      "ইনভার্টার স্প্লিট",
      "নন-ইনভার্টার স্প্লিট",
      "ক্যাসেট",
      "স্মার্ট স্প্লিট",
    ],
  },
  "washing-machine": {
    en: ["Front Load", "Top Load", "Twin Tub", "Fully Automatic"],
    bn: ["ফ্রন্ট লোড", "টপ লোড", "টুইন টাব", "ফুলি অটোমেটিক"],
  },
  microwave: {
    en: ["Solo", "Grill", "Convection", "Digital"],
    bn: ["সোলো", "গ্রিল", "কনভেকশন", "ডিজিটাল"],
  },
  blender: {
    en: ["Stand Blender", "Hand Blender", "Juicer Mixer", "3-in-1 Mixer"],
    bn: [
      "স্ট্যান্ড ব্লেন্ডার",
      "হ্যান্ড ব্লেন্ডার",
      "জুসার মিক্সার",
      "৩-ইন-১ মিক্সার",
    ],
  },
  "rice-cooker": {
    en: [
      "Mini Rice Cooker",
      "Multi Rice Cooker",
      "Pressure Rice Cooker",
      "Deluxe Rice Cooker",
    ],
    bn: [
      "মিনি রাইস কুকার",
      "মাল্টি রাইস কুকার",
      "প্রেসার রাইস কুকার",
      "ডিলাক্স রাইস কুকার",
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Generation                                                           */
/* ------------------------------------------------------------------ */

const TOTAL_PRODUCTS = 500;

// Fixed reference date (no Date.now()) — every product's createdAt is this
// date minus a deterministic number of days, so "Newest" sort has spread.
const CATALOG_EPOCH = new Date("2026-09-01T00:00:00.000Z");

function generateProducts(): ShopProduct[] {
  const products: ShopProduct[] = [];

  for (let i = 0; i < TOTAL_PRODUCTS; i++) {
    const rand = seededRandom(i * 97 + 13);

    const category = CATEGORIES[i % CATEGORIES.length];
    const brand = BRANDS[(i * 3 + 1) % BRANDS.length];
    const parts = NAME_PARTS[category.slug];
    const partIndex = i % parts.en.length;

    const priceSpan = category.priceMax - category.priceMin;
    const price =
      Math.round((category.priceMin + rand() * priceSpan) / 100) * 100;

    const isOnSale = i % 3 === 0;
    const originalPrice = isOnSale
      ? Math.round((price * (1.1 + rand() * 0.25)) / 100) * 100
      : undefined;

    const rating = Math.round((3.4 + rand() * 1.6) * 10) / 10;

    const colorCount = 1 + Math.floor(rand() * 3); // 1–3 colors
    const colors: ProductColor[] = Array.from(
      { length: colorCount },
      (_, c) => {
        const idx = (i + c * 2) % COLOR_PALETTE.length;
        return COLOR_PALETTE[idx];
      },
    );

    const modelNumber = 1000 + ((i * 37) % 900);
    const daysAgo = (i * 5) % 180;
    const createdAt = new Date(
      CATALOG_EPOCH.getTime() - daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString();

    products.push({
      id: `${category.slug}-${i}`,
      name: {
        en: `${brand.en} ${parts.en[partIndex]} ${modelNumber}`,
        bn: `${brand.bn} ${parts.bn[partIndex]} ${modelNumber}`,
      },
      brand: { en: brand.en, bn: brand.bn },
      brandSlug: brand.slug,
      category: { en: category.en, bn: category.bn },
      categorySlug: category.slug,
      tag: isOnSale ? { en: "Best Deal", bn: "সেরা অফার" } : undefined,
      price,
      originalPrice,
      rating,
      colors,
      // NOTE: swap for real product photography once the backend lands.
      // Add "picsum.photos" to next.config's images.remotePatterns to use
      // this placeholder source, or point it at local files in /public.
      image: `https://picsum.photos/seed/${category.slug}-${i}/600/600`,
      href: `/products/${category.slug}-${i}`,
      inStock: i % 7 !== 0,
      createdAt,
    });
  }

  return products;
}

export const DUMMY_PRODUCTS: ShopProduct[] = generateProducts();

export const CATEGORY_LIST = CATEGORIES.map(({ slug, en, bn }) => ({
  value: slug,
  label: { en, bn },
}));

export const BRAND_LIST = BRANDS.map(({ slug, en, bn }) => ({
  value: slug,
  label: { en, bn },
}));

export const COLOR_LIST = COLOR_PALETTE;
