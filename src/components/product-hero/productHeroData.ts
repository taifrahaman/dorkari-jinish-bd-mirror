// src/components/product-hero/productHeroData.ts

export type ProductHeroAtmosphere = {
  base: string;
  primary: string;
  secondary: string;
  tertiary: string;
};

export type ProductHeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  shortName: string;
  image: string;
  href: string;
  atmosphere: ProductHeroAtmosphere;
};

export const productHeroSlides: ProductHeroSlide[] = [
  {
    id: "product-01",
    eyebrow: "SMART KITCHEN",
    title: "Boil water faster.\nSave precious time.",
    description:
      "High-speed stainless steel electric kettle designed for rapid boiling, energy efficiency, and daily convenience.",
    price: "৳ 2,450",
    shortName: "Electric Kettle",
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
    eyebrow: "HOME CARE",
    title: "Crisp, wrinkle-free clothes.\nEvery single day.",
    description:
      "Non-stick soleplate electric iron featuring precise temperature control for effortless ironing across all fabrics.",
    price: "৳ 1,850",
    shortName: "Electric Iron",
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
    eyebrow: "HEALTHY COOKING",
    title: "Crispy food.\nZero guilt.",
    description:
      "Rapid air circulation technology that lets you fry, bake, and grill your favorite snacks with up to 80% less oil.",
    price: "৳ 7,500",
    shortName: "Air Fryer",
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
    eyebrow: "KITCHEN ESSENTIALS",
    title: "Fluffy, perfect rice.\nCooked automatically.",
    description:
      "Multi-function automatic rice cooker featuring keep-warm technology and durable non-stick inner pot design.",
    price: "৳ 4,200",
    shortName: "Rice Cooker",
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
    eyebrow: "BAKING & DESSERTS",
    title: "Whip and blend.\nWith ultimate ease.",
    description:
      "Ergonomic multi-speed electric hand mixer perfect for whipping cream, beating eggs, and preparing light batter.",
    price: "৳ 1,600",
    shortName: "Electric Whisker",
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
