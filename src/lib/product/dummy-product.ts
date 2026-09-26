// src/lib/product/dummy-product.ts

import type { ProductDetail } from "./types";

// Deterministic placeholder photos — swap for real product photography later.
const shot = (seed: string) => `https://picsum.photos/seed/${seed}/900/900`;

const t = (en: string, bn: string) => ({ en, bn });

export const DUMMY_PRODUCT: ProductDetail = {
  id: "jamuna-rc-1201",
  slug: "jamuna-deluxe-rice-cooker-1201",
  name: t("Jamuna Deluxe Rice Cooker 1201", "যমুনা ডিলাক্স রাইস কুকার ১২০১"),
  brand: "Jamuna",
  categoryValue: "rice-cookers",
  categoryLabel: t("Rice Cookers", "রাইস কুকার"),
  model: "JRC-1201X",
  price: 2100,
  originalPrice: 2500,
  stock: "low-stock",
  lowStockThreshold: 5,
  stockCount: 4,
  description: t(
    "A 1.8-litre non-stick rice cooker built for everyday family cooking. One-touch cook-and-warm switching, a tempered glass lid so you can check on your rice without losing heat, and a cool-touch handle that stays comfortable through long cook cycles. Compact enough for a small kitchen counter, large enough for six servings.",
    "প্রতিদিনের রান্নার জন্য তৈরি ১.৮ লিটার নন-স্টিক রাইস কুকার। এক-চাপে রান্না ও গরম রাখার সুইচ, তাপ-প্রতিরোধী কাচের ঢাকনা যাতে তাপ না হারিয়ে ভাত দেখা যায়, এবং দীর্ঘ সময় রান্নার পরেও আরামদায়ক ঠান্ডা হ্যান্ডেল। ছোট রান্নাঘরের জন্য যথেষ্ট কমপ্যাক্ট, আবার ছয় জনের জন্য যথেষ্ট বড়।",
  ),
  variants: [
    {
      id: "white",
      hex: "#F5F1EA",
      name: t("Pearl White", "পার্ল হোয়াইট"),
      images: [
        {
          id: "w-1",
          src: shot("jrc1201-white-1"),
          alt: t(
            "Jamuna rice cooker, pearl white, front view",
            "যমুনা রাইস কুকার, সাদা রঙ, সামনের দৃশ্য",
          ),
        },
        {
          id: "w-2",
          src: shot("jrc1201-white-2"),
          alt: t(
            "Pearl white rice cooker with lid open",
            "সাদা রাইস কুকার, ঢাকনা খোলা",
          ),
        },
        {
          id: "w-3",
          src: shot("jrc1201-white-3"),
          alt: t(
            "Rice cooker inner pot, non-stick coating",
            "রাইস কুকারের ভেতরের পাত্র, নন-স্টিক কোটিং",
          ),
        },
        {
          id: "w-4",
          src: shot("jrc1201-white-4"),
          alt: t(
            "Rice cooker control panel close-up",
            "রাইস কুকারের নিয়ন্ত্রণ প্যানেলের ক্লোজ-আপ",
          ),
        },
      ],
    },
    {
      id: "maroon",
      hex: "#7A2E2E",
      name: t("Deep Maroon", "গাঢ় মেরুন"),
      images: [
        {
          id: "m-1",
          src: shot("jrc1201-maroon-1"),
          alt: t(
            "Jamuna rice cooker, deep maroon, front view",
            "যমুনা রাইস কুকার, মেরুন রঙ, সামনের দৃশ্য",
          ),
        },
        {
          id: "m-2",
          src: shot("jrc1201-maroon-2"),
          alt: t(
            "Maroon rice cooker on a kitchen counter",
            "মেরুন রাইস কুকার, রান্নাঘরের কাউন্টারে",
          ),
        },
        {
          id: "m-3",
          src: shot("jrc1201-maroon-3"),
          alt: t(
            "Rice cooker steam vent detail",
            "রাইস কুকারের বাষ্প ভেন্টের বিস্তারিত",
          ),
        },
      ],
    },
  ],
  weight: t("2.6 kg", "২.৬ কেজি"),
  dimensions: t("27 × 27 × 24 cm", "২৭ × ২৭ × ২৪ সেমি"),
  warrantyMonths: 12,
  boxContents: [
    t("Rice cooker body & lid", "রাইস কুকারের বডি ও ঢাকনা"),
    t("Non-stick inner pot", "নন-স্টিক ভেতরের পাত্র"),
    t("Measuring cup", "মাপার কাপ"),
    t("Rice paddle", "ভাত নাড়ার চামচ"),
    t("Warranty card", "ওয়ারেন্টি কার্ড"),
  ],
  deliveryEstimate: t(
    "Delivery in 2–4 days across Dhaka",
    "ঢাকার মধ্যে ২-৪ দিনে ডেলিভারি",
  ),
  returnPolicy: t(
    "7-day easy return if unused and in original packaging",
    "অব্যবহৃত ও মূল প্যাকেজিং থাকলে ৭ দিনের সহজ রিটার্ন",
  ),
  faqs: [
    {
      id: "faq-1",
      question: t(
        "Does it switch off automatically after cooking?",
        "রান্না শেষে কি এটি নিজে থেকে বন্ধ হয়ে যায়?",
      ),
      answer: t(
        "Yes. It switches from Cook to Warm on its own once the rice is done, and stays on Warm safely for hours.",
        "হ্যাঁ। ভাত রান্না শেষ হলে এটি নিজে থেকে কুক থেকে ওয়ার্মে চলে যায়, এবং ঘণ্টার পর ঘণ্টা নিরাপদে ওয়ার্ম থাকে।",
      ),
    },
    {
      id: "faq-2",
      question: t(
        "What's the maximum rice capacity?",
        "সর্বোচ্চ কত চাল রান্না করা যায়?",
      ),
      answer: t(
        "Up to 1.8 litres of cooked rice — comfortably 5 to 6 servings in one batch.",
        "সর্বোচ্চ ১.৮ লিটার রান্না করা ভাত — এক ব্যাচে আরামে ৫ থেকে ৬ জনের জন্য।",
      ),
    },
    {
      id: "faq-3",
      question: t(
        "Is the inner pot dishwasher safe?",
        "ভেতরের পাত্রটি কি ডিশওয়াশারে ধোয়া যায়?",
      ),
      answer: t(
        "Hand-washing is recommended to protect the non-stick coating, but it's also dishwasher-safe on a gentle cycle.",
        "নন-স্টিক কোটিং রক্ষা করতে হাতে ধোয়ার পরামর্শ দেওয়া হয়, তবে হালকা সাইকেলে ডিশওয়াশারেও ধোয়া যায়।",
      ),
    },
    {
      id: "faq-4",
      question: t(
        "What's covered under the 12-month warranty?",
        "১২ মাসের ওয়ারেন্টিতে কী অন্তর্ভুক্ত?",
      ),
      answer: t(
        "Manufacturing defects in the heating element and control panel. Physical damage and normal wear aren't covered.",
        "হিটিং এলিমেন্ট ও কন্ট্রোল প্যানেলের উৎপাদনজনিত ত্রুটি অন্তর্ভুক্ত। শারীরিক ক্ষতি ও স্বাভাবিক ক্ষয় অন্তর্ভুক্ত নয়।",
      ),
    },
    {
      id: "faq-5",
      question: t(
        "Can I cook other things besides rice?",
        "ভাত ছাড়া আর কি রান্না করা যায়?",
      ),
      answer: t(
        "Yes — it handles khichuri, porridge, and steaming vegetables well. Avoid thick batters that can stick and burn.",
        "হ্যাঁ — এটি খিচুড়ি, জাউ, এবং সবজি ভাপানোর জন্যও ভালো কাজ করে। ঘন ব্যাটার এড়িয়ে চলুন যা লেগে পুড়ে যেতে পারে।",
      ),
    },
  ],
  rating: 4.6,
  reviewCount: 128,
  reviews: [
    {
      id: "rv-1",
      author: "Nusrat J.",
      rating: 5,
      date: "2026-09-02",
      verified: true,
      title: t(
        "Perfect for a family of four",
        "চার জনের পরিবারের জন্য পারফেক্ট",
      ),
      body: t(
        "Been using it daily for two months. Rice comes out even every single time and cleanup is quick.",
        "দুই মাস ধরে প্রতিদিন ব্যবহার করছি। প্রতিবার সমান রান্না হয় এবং পরিষ্কার করাও সহজ।",
      ),
      helpfulCount: 24,
    },
    {
      id: "rv-2",
      author: "Rafiq H.",
      rating: 4,
      date: "2026-08-21",
      verified: true,
      body: t(
        "Good value. The lid seal could be a bit tighter, but performance is solid.",
        "ভালো দাম। ঢাকনার সিলটা আরেকটু টাইট হতে পারত, তবে পারফরম্যান্স ভালো।",
      ),
      helpfulCount: 9,
    },
    {
      id: "rv-3",
      author: "Ayesha K.",
      rating: 5,
      date: "2026-08-10",
      verified: false,
      title: t("Bought as a gift", "উপহার হিসেবে কিনেছি"),
      body: t(
        "Got this for my mother — she says it's easier to use than her old one and heats up faster.",
        "আমার মায়ের জন্য কিনেছি — তিনি বলেন এটা তার পুরনোটার চেয়ে ব্যবহার করা সহজ এবং দ্রুত গরম হয়।",
      ),
      helpfulCount: 15,
    },
    {
      id: "rv-4",
      author: "Tanvir A.",
      rating: 3,
      date: "2026-07-30",
      verified: true,
      body: t(
        "Does the job but the outer body scratches a little easily. Cooking performance is fine.",
        "কাজ ঠিকঠাক করে তবে বাইরের বডিতে সহজেই একটু দাগ পড়ে। রান্নার পারফরম্যান্স ঠিক আছে।",
      ),
      helpfulCount: 4,
    },
    {
      id: "rv-5",
      author: "Farzana S.",
      rating: 5,
      date: "2026-07-12",
      verified: true,
      body: t(
        "Switched from a much pricier brand and honestly can't tell the difference in rice quality.",
        "অনেক দামি একটি ব্র্যান্ড থেকে পরিবর্তন করেছি, সত্যি বলতে ভাতের মানে কোনো পার্থক্য বুঝতে পারিনি।",
      ),
      helpfulCount: 31,
    },
    {
      id: "rv-6",
      author: "Kamal U.",
      rating: 4,
      date: "2026-06-28",
      verified: false,
      body: t(
        "Solid everyday cooker. Wish it came with a steaming tray included.",
        "প্রতিদিনের জন্য ভালো কুকার। স্টিমিং ট্রে দেওয়া থাকলে আরও ভালো হতো।",
      ),
      helpfulCount: 7,
    },
  ],
};
