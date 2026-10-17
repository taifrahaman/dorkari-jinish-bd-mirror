// src/components/home-hero/heroCollections.ts
import type { CSSProperties } from "react";

export type Lang = "bn" | "en";
export type Bi = Record<Lang, string>;
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

export const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

export type HeroPick = {
  id: string;
  name: Bi;
  price: number;
  compareAt?: number;
  /** Product image URL. Falls back to PLACEHOLDER_IMAGE when empty. */
  image?: string | null;
  /** Product slug → /[locale]/product/[slug]. Falls back to the collection's category page. */
  slug?: string;
};

export type HeroCollection = {
  id: string;
  label: Bi;
  /** Category slug used for the "See all" link and as the pick fallback link. */
  categorySlug: string;
  /** "r,g,b" of this collection's light. */
  glow: string;
  picks: HeroPick[];
};

/**
 * SAMPLE DATA. Replace `picks` with real in-stock / discounted products
 * fetched per category, and make sure each `categorySlug` matches a real slug.
 */
export const HERO_COLLECTIONS: HeroCollection[] = [
  {
    id: "kitchen",
    label: { en: "Kitchen", bn: "রান্নাঘর" },
    categorySlug: "cookware",
    glow: "251,167,5",
    picks: [
      {
        id: "k1",
        name: { en: "Non-stick Fry Pan", bn: "নন-স্টিক ফ্রাই প্যান" },
        price: 1250,
        compareAt: 1490,
      },
      {
        id: "k2",
        name: { en: "Stainless Steel Pot Set", bn: "স্টেইনলেস স্টিল পটের সেট" },
        price: 2450,
      },
      {
        id: "k3",
        name: { en: "Pressure Cooker 5L", bn: "প্রেসার কুকার ৫ লিটার" },
        price: 2990,
      },
      { id: "k4", name: { en: "Chef's Knife", bn: "শেফ নাইফ" }, price: 480 },
    ],
  },
  {
    id: "cooling",
    label: { en: "Cool & Comfort", bn: "ঠান্ডা ও আরাম" },
    categorySlug: "home-appliance",
    glow: "96,190,255",
    picks: [
      {
        id: "c1",
        name: { en: 'Table Fan 16"', bn: 'টেবিল ফ্যান ১৬"' },
        price: 2350,
      },
      {
        id: "c2",
        name: {
          en: "Rechargeable Stand Fan",
          bn: "রিচার্জেবল স্ট্যান্ড ফ্যান",
        },
        price: 4200,
        compareAt: 4800,
      },
      {
        id: "c3",
        name: { en: 'Ceiling Fan 56"', bn: 'সিলিং ফ্যান ৫৬"' },
        price: 3650,
      },
      {
        id: "c4",
        name: { en: "Mini Portable Fan", bn: "মিনি পোর্টেবল ফ্যান" },
        price: 690,
      },
    ],
  },
  {
    id: "lights",
    label: { en: "Lights", bn: "আলো" },
    categorySlug: "light",
    glow: "255,226,80",
    picks: [
      {
        id: "l1",
        name: { en: "LED Bulb 12W", bn: "এলইডি বাল্ব ১২ ওয়াট" },
        price: 190,
      },
      { id: "l2", name: { en: "Table Lamp", bn: "টেবিল ল্যাম্প" }, price: 850 },
      {
        id: "l3",
        name: { en: "Decorative String Light", bn: "ডেকোরেটিভ স্ট্রিং লাইট" },
        price: 320,
        compareAt: 399,
      },
      {
        id: "l4",
        name: {
          en: "Rechargeable Emergency Light",
          bn: "রিচার্জেবল ইমার্জেন্সি লাইট",
        },
        price: 950,
      },
    ],
  },
  {
    id: "gifts",
    label: { en: "Gifts", bn: "উপহার" },
    categorySlug: "gift",
    glow: "255,138,170",
    picks: [
      { id: "g1", name: { en: "Wall Clock", bn: "ওয়াল ক্লক" }, price: 780 },
      {
        id: "g2",
        name: { en: "Gift Box Set", bn: "গিফট বক্স সেট" },
        price: 650,
      },
      {
        id: "g3",
        name: { en: "Party Balloon Pack", bn: "পার্টি বেলুন প্যাক" },
        price: 220,
      },
      {
        id: "g4",
        name: { en: "Home Decor Showpiece", bn: "হোম ডেকর শো-পিস" },
        price: 540,
      },
    ],
  },
  {
    id: "kids",
    label: { en: "Kids", bn: "ছোটদের" },
    categorySlug: "toy",
    glow: "94,214,160",
    picks: [
      {
        id: "t1",
        name: { en: "Toy Car Set", bn: "খেলনা গাড়ির সেট" },
        price: 450,
      },
      {
        id: "t2",
        name: { en: "Building Blocks", bn: "বিল্ডিং ব্লকস" },
        price: 690,
      },
      { id: "t3", name: { en: "Kids Watch", bn: "কিডস ওয়াচ" }, price: 380 },
      {
        id: "t4",
        name: { en: "Pretend Play Kitchen Set", bn: "রান্নাবান্নার খেলনা সেট" },
        price: 1150,
        compareAt: 1390,
      },
    ],
  },
];
