// src/components/product-hero/productHeroData.ts

export type ProductHeroLocaleText = {
  en: string;
  bn: string;
};

export type ProductHeroAtmosphere = {
  base: string;
  primary: string;
  secondary: string;
  tertiary: string;
};

export type ProductHeroSlide = {
  id: string;
  eyebrow: ProductHeroLocaleText;
  title: ProductHeroLocaleText;
  description: ProductHeroLocaleText;
  price: ProductHeroLocaleText;
  shortName: ProductHeroLocaleText;
  image: string;
  href: string;
  atmosphere: ProductHeroAtmosphere;
};

export const productHeroSlides: ProductHeroSlide[] = [
  {
    id: "product-01",

    eyebrow: {
      en: "SMART KITCHEN",
      bn: "স্মার্ট কিচেন",
    },

    title: {
      en: "Boil water faster.\nSave precious time.",
      bn: "পানি ফুটবে দ্রুত।\nসময় বাঁচবে প্রতিদিন।",
    },

    description: {
      en: "High-speed stainless steel electric kettle designed for rapid boiling, energy efficiency, and daily convenience.",
      bn: "দ্রুত পানি ফুটানো, শক্তি সাশ্রয় এবং প্রতিদিনের সুবিধার জন্য তৈরি হাই-স্পিড স্টেইনলেস স্টিল ইলেকট্রিক কেটলি।",
    },

    price: {
      en: "৳ 2,450",
      bn: "৳ ২,৪৫০",
    },

    shortName: {
      en: "Electric Kettle",
      bn: "ইলেকট্রিক কেটলি",
    },

    image: "/banner/product-01.png",
    href: "#",

    atmosphere: {
      base: "#100D22",
      primary: "#39215E",
      secondary: "#172E61",
      tertiary: "#5A315F",
    },
  },

  {
    id: "product-02",

    eyebrow: {
      en: "HOME CARE",
      bn: "হোম কেয়ার",
    },

    title: {
      en: "Crisp, wrinkle-free clothes.\nEvery single day.",
      bn: "কাপড় থাকুক ঝকঝকে।\nপ্রতিদিন, প্রতিবার।",
    },

    description: {
      en: "Non-stick soleplate electric iron featuring precise temperature control for effortless ironing across all fabrics.",
      bn: "সব ধরনের কাপড় সহজে ইস্ত্রি করার জন্য সুনির্দিষ্ট তাপমাত্রা নিয়ন্ত্রণসহ নন-স্টিক সোলপ্লেট ইলেকট্রিক আয়রন।",
    },

    price: {
      en: "৳ 1,850",
      bn: "৳ ১,৮৫০",
    },

    shortName: {
      en: "Electric Iron",
      bn: "ইলেকট্রিক আয়রন",
    },

    image: "/banner/product-02.png",
    href: "#",

    atmosphere: {
      base: "#0C1721",
      primary: "#123E5D",
      secondary: "#245D66",
      tertiary: "#17324E",
    },
  },

  {
    id: "product-03",

    eyebrow: {
      en: "HEALTHY COOKING",
      bn: "স্বাস্থ্যকর রান্না",
    },

    title: {
      en: "Crispy food.\nZero guilt.",
      bn: "মজাদার ক্রিসপি খাবার।\nগিল্ট একদম নয়।",
    },

    description: {
      en: "Rapid air circulation technology that lets you fry, bake, and grill your favorite snacks with up to 80% less oil.",
      bn: "র‍্যাপিড এয়ার সার্কুলেশন প্রযুক্তিতে আপনার প্রিয় খাবার ৮০% পর্যন্ত কম তেল দিয়ে ফ্রাই, বেক ও গ্রিল করুন।",
    },

    price: {
      en: "৳ 7,500",
      bn: "৳ ৭,৫০০",
    },

    shortName: {
      en: "Air Fryer",
      bn: "এয়ার ফ্রায়ার",
    },

    image: "/banner/product-03.png",
    href: "#",

    atmosphere: {
      base: "#19120D",
      primary: "#5B321F",
      secondary: "#713F2E",
      tertiary: "#33201B",
    },
  },

  {
    id: "product-04",

    eyebrow: {
      en: "KITCHEN ESSENTIALS",
      bn: "কিচেন এসেনশিয়ালস",
    },

    title: {
      en: "Fluffy, perfect rice.\nCooked automatically.",
      bn: "ঝরঝরে, পারফেক্ট ভাত।\nরান্না হবে অটোমেটিক।",
    },

    description: {
      en: "Multi-function automatic rice cooker featuring keep-warm technology and durable non-stick inner pot design.",
      bn: "কিপ-ওয়ার্ম প্রযুক্তি এবং টেকসই নন-স্টিক ইনার পটসহ মাল্টি-ফাংশন অটোমেটিক রাইস কুকার।",
    },

    price: {
      en: "৳ 4,200",
      bn: "৳ ৪,২০০",
    },

    shortName: {
      en: "Rice Cooker",
      bn: "রাইস কুকার",
    },

    image: "/banner/product-04.png",
    href: "#",

    atmosphere: {
      base: "#0C1B1C",
      primary: "#18524F",
      secondary: "#285C70",
      tertiary: "#183A3E",
    },
  },

  {
    id: "product-05",

    eyebrow: {
      en: "BAKING & DESSERTS",
      bn: "বেকিং ও ডেজার্ট",
    },

    title: {
      en: "Whip and blend.\nWith ultimate ease.",
      bn: "মিক্স ও হুইপ করুন।\nসহজেই, অনায়াসে।",
    },

    description: {
      en: "Ergonomic multi-speed electric hand mixer perfect for whipping cream, beating eggs, and preparing light batter.",
      bn: "ক্রিম হুইপ করা, ডিম বিট করা এবং হালকা ব্যাটার তৈরির জন্য উপযোগী এরগোনমিক মাল্টি-স্পিড ইলেকট্রিক হ্যান্ড মিক্সার।",
    },

    price: {
      en: "৳ 1,600",
      bn: "৳ ১,৬০০",
    },

    shortName: {
      en: "Electric Whisker",
      bn: "ইলেকট্রিক হুইস্কার",
    },

    image: "/banner/product-05.png",
    href: "#",

    atmosphere: {
      base: "#17121F",
      primary: "#452C67",
      secondary: "#283E71",
      tertiary: "#5A365D",
    },
  },
];
